#!/bin/bash

set -euo pipefail
IFS=$'\n\t'

#filter out unnecessary ec2 instances here
aws ec2 describe-instances \
    | jq '.Reservations[].Instances[]
        | {
            privateDnsName   : .PrivateDnsName,
            privateIpAddress : .PrivateIpAddress,
            keyName          : .KeyName,
            instanceId       : .InstanceId,
            tags             : .Tags | select(. != null) | sort_by(.Key) | from_entries
        }' \
    | jq '{
            name             : .tags.Name,
            privateDnsName   : .privateDnsName,
            privateIpAddress : .privateIpAddress,
            keyName          : .keyName,
            instanceId       : .instanceId,
            tags             : .tags
        }'
