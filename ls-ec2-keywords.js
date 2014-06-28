#!/usr/bin/env node

'use strict'

var Q = require("q");

console.log = function(){};

var INSTANCE_DESC_DIR="/var/aws-cli/cache/describe-instances.d/";

var getAllKeywords = function (){
	var deferred = Q.defer();
	getFileList(INSTANCE_DESC_DIR)
		.then(readFiles)
		.then(collectKeywords)
		.then(function(keywords){
			deferred.resolve(keywords);
		}).done();

	return deferred.promise;
};

var getHostnameForKeyword = function(keyword){
	var deferred = Q.defer();
	getFileList(INSTANCE_DESC_DIR)
		.then(readFiles)
		.then(function(instances) {
			return findMatchingInstance(keyword, instances);
		}).then(function(instances){
			if(!!instances){
				var hostNames = instances.map(function(instance){
					if(!!instance && !!instance.PublicDnsName){
						return instance.PublicDnsName;
					}
				});

				var retval = [];
				hostNames.forEach(function(hostname, index, arr){
					if(!!hostname){
						retval.push(hostname);
					}
				});

				debugger;
				if(retval.length === 1){
					deferred.resolve(retval[0]);
				} else if(retval.length>1){
					var error = "found multiple matches for " + keyword + ".\n"
					retval.forEach(function (hs, index){
						error += "" + (index+1) + " - " +hs + "\n";
					});
					
					deferred.reject(error);
				} else {
					console.log("no hostname found");
					deferred.reject();
				}
			} else {
				deferred.reject();
			}
		})
		.done();
	
	return deferred.promise;
};

var getSshKeyForKeyword = function(keyword){
	var deferred = Q.defer();
	getFileList(INSTANCE_DESC_DIR)
	.then(readFiles)
	.then(function(instances) {
		return findMatchingInstance(keyword, instances);
	}).then(function(instances){
		if(!!instances){
			var keys = instances.map(function(instance){
				if(!!instance.KeyName){
					return instance.KeyName;
				}
			});
			
			var retval = [];
			keys.forEach(function(key, index, arr){
				if(!!key){
					retval.push(key);
				}
			});

			if(retval.length>0){
				deferred.resolve(retval);
			} else {
				console.log("no key found");
				deferred.reject();
			}
		} else {
			deferred.reject();
		}
	})
	.done();

	return deferred.promise;
};

var findMatchingInstance = function(keyword, instances){
	var deferred = Q.defer();
	
	var retval = [];
	retval = retval.concat.apply(retval, instances.map(function(instance){
		if(instance.PublicIpAddress === keyword || 
			instance.PublicDnsName === keyword ||
			instance.InstanceId === keyword){
			return instance;
		}

		if(!!instance && !!instance.Tags){
            return instance.Tags.map(function(tag){
			    if(tag.Key === 'Name' && 
					    tag.Value.replace(/\s/gi, '_').toLowerCase() === keyword){
				    return instance;
			    }
		    });
        }
	}));
	
	var instances = [];
	retval.forEach(function(item, index, arr){
		if(!!item){
			instances.push(item);
		}
	});
	console.log("findMatchingInstance instances.length = " +instances.length);
	
	deferred.resolve(instances);
	
	return deferred.promise;
}

var getFileList = function(dir){
	var deferred = Q.defer();
	var fs = require('fs');
	
	fs.readdir(dir, function (err, files){
		if (err){
			deferred.reject(err);
		} else {
			deferred.resolve(files);
		}
	});
	
	return deferred.promise;
};

var readFiles = function(files){
	console.log("readFiles called with " +files);

	var deferred = Q.defer();

	var promises = [];
	files.forEach(function(file, index, arr){
		promises.push(getInstances(file));
	});
	
	console.log("waiting for getInstances to resolve");
	Q.all(promises).then(function (){
		console.log("all getInstances resolved");
		
		var instances = [];
		
		promises.forEach(function(promise, index, arr){
			instances = instances.concat.apply(instances, promise);
		});
		
		deferred.resolve(instances);
	}, function (error){
		console.log("some error!" +error);
		deferred.reject(error);
	});

	return deferred.promise;
};

var getInstances = function(fileName){
	console.log("getInstances called with " +fileName);
	
	var deferred = Q.defer();
	
	var fs = require('fs');
	fs.readFile(INSTANCE_DESC_DIR +"/" +fileName, 'utf-8', function (err, currentInput) {
		if (err) {
			deferred.reject(err);
		} else {
			try {
				var json = JSON.parse(currentInput);
				console.log("parsed describe-instances file. " +fileName);

				var arr = [];
				json.Reservations.forEach(function(reservation, index, array){
					reservation.Instances.forEach(function (instance, index, array){
						arr.push(instance);
					});
				});

				deferred.resolve(arr);
			} catch (e) {
				deferred.reject(e);
			}
		}
	});

	return deferred.promise;
};

var collectKeywords = function(instances){
	console.log("collectKeywords called with " +instances.length +" instances");
	var deferred = Q.defer();
	
	var allKeywords = [];

	allKeywords = allKeywords.concat.apply(allKeywords, instances.map(function(instance){
		var nameArr = [];
        if(!!instance && !!instance.Tags){
            nameArr = instance.Tags.map(function(tag){
			    if(tag.Key === 'Name'){
				    return tag.Value.replace(/\s/gi, '_').toLowerCase();
			    }
		    });
        }

		var retval =  [];
		if(!!instance.PublicIpAddress){
			retval.push(instance.PublicIpAddress);
		}
		if(!!instance.PublicDnsName){
			retval.push(instance.PublicDnsName);
		}
		if(!!instance.InstanceId){
			retval.push(instance.InstanceId);
		}

		if(!!nameArr){
			nameArr.forEach(function(name){
				if(!!name){
					retval.push(name);
				}
			});
		}

		return retval;
	}));

	console.log("allKeywords.length = " +allKeywords.length);
	deferred.resolve(allKeywords);
	
	return deferred.promise;
};

/*
 * If invoked with no arguments then return all the keywords.
 * If invoked with 1 parameter return Public DNS name for the given keyword or error
 * If invoked with 2 parameters '--get-ssh-key <keyword>' then return the ssh_key for the matching instance
 * */

var args = process.argv.slice(2);

if(args.length === 0){
	//return all keywords
	
	console.log("CLI: return all keywords");
	getAllKeywords().then(function(keywords){
		console.log("getAllKeywords resolved...");
		process.stdout.write(keywords.join(" "));
	}).done(function(error){
		if(error){
			debugger;
			console.log("Error!!!" +error);
		}
	});
} else if(args.length === 1){
	var keyword = args[0];
	
	//return DNS for keyword
	console.log("CLI: return PublicDnsName");
	getHostnameForKeyword(keyword)
		.then(function(name){
			process.stdout.write(name);
		}, function(error){
			debugger;
			process.stderr.write(error);
		})
	.done();
} else if(args.length == 2){
	//check if --get-ssh-key is requested
	var arg = args[0];
	if(arg === '--get-ssh-key'){
		console.log("CLI: return ssh-key");
		
		getSshKeyForKeyword(args[1])
			.then(function (keyName){
				process.stdout.write(keyName.join(", "));
			}, function (error){
				process.stderr.write("no ssh_key found\n");
			})
			.done();
	} else {
		console.log("CLI: not supported? " +args);
		process.exit(1);
	}
} else {
	//error?
	console.log("cli not supported? " +args);
	process.stderr.write("usage: ls-ec2-keywords [ <keyword> | --get-ssh-key ]\n");
}
