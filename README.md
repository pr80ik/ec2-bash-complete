ec2-bash-complete
=================

TODO: add description

Setup
-----

1. add complete-ssh-ec2 to startup via. .bash_profile
    e.g. ```. complete-ssh-ec2```

2. add ssh-ec2 and ls-ec2-keywords.js to path
    e.g. by copying to ~/bin/ directory

3. add a cron job to generate the AWS EC2 instance description file in directory /var/aws-cli/cache/describe-instances.d/
    e.g. 
    ```mkdir -p /var/aws-cli/cache/describe-instances.d/
    aws ec2 describe-instances --region us-east-1 --profile my-aws-profile > /var/aws-cli/cache/describe-instances.d/my-aws-ec2-instances.json
    ```

4. copy the ssh_keys to ~/.ssh (or update the path in script ~/bin/ssh-ec2

5. npm installation is required, npm module q should be installed via 'npm install q' TODO: add details

6. now when you issue the command ssh-ec2 [TAB] the instnce names should autocomplete

