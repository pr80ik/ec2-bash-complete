ec2-bash-complete
=================

Bash auto-complete script for AWS-EC2 instance names

Setup
-----

1. add `complete-ssh-ec2` to startup via. `~/.bash_profile`

    ```bash
        source /path/to/ec2-bash-complete/complete-ssh-ec2
    ```

2. add `ssh-ec2` and `aws-instances.sh` to path
    e.g. by copying to `~/bin/` directory

3. Install `AWS CLI` and [configure](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html#cli-quick-configuration) it.

4. add a cron job to generate the AWS EC2 instance description file in directory `/var/aws-cli/cache/describe-instances.d/`
    
    ```bash
    mkdir -p /var/aws-cli/cache/describe-instances.d/

    aws-instances.sh > /var/aws-cli/cache/describe-instances.d/ec2-desc.json
    ```

5. Configure [ssh-agent](https://developer.github.com/guides/using-ssh-agent-forwarding/#setting-up-ssh-agent-forwarding), and add your _ssh key_ to _ssh-agent_ using `ssh-add` command.

6. Install `jq` tool from [GitHub](https://stedolan.github.io/jq/download/).

7. now when you issue the command `ssh-ec2 [TAB]` the instance names should autocomplete
