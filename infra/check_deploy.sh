#!/bin/bash
export CLUSTER=fs-evm-$ENV
export FML=backend-$ENV
export TF_LOG_CORE=ERROR
export TF_LOG_PROVIDER=ERROR
export TF_LOG_PATH=logs.txt
export error_ecs="ApplyResourceChange"
export error_stop="in task exited"
task_stable=$(aws ecs describe-services --cluster $CLUSTER --service backend --query services[0].deployments[0].taskDefinition --output text)
image_stable=$(aws ecs describe-task-definition --task-definition $task_stable --query taskDefinition.containerDefinitions[0].image --output text)
terraform init -backend-config=./cfbackend.tfvars
#timeout 360 
terraform apply -var="stage_name=$ENV" -auto-approve
sleep 10
if [[ $(cat logs.txt) == *"$error_ecs"* ]]; then
    echo "Error found"
    echo "Revert old ECS service"
    aws ecs update-service --cluster $CLUSTER --service backend --task-definition $task_stable >> update.logs
    sleep 10
    for out in {1..10}
    do
        test_log=$(aws ecs describe-services --cluster $CLUSTER --service backend --query services[0].events[$out])
        if [[ "$test_log" == *"has started 1 tasks"* ]]; then
            message=$(aws ecs describe-services --cluster $CLUSTER --service backend --query services[0].events[$out].message) 
            echo "$message"
            regex_1='\w+\)\.'
            regex_2='\w+'
            [[ $message =~ $regex_1 ]]
            raw_task="${BASH_REMATCH[0]}"
            [[ $raw_task =~ $regex_2 ]]
            task="${BASH_REMATCH[0]}"
            echo "$task"
            stop_log=$(aws ecs describe-tasks --cluster $CLUSTER --task $task --query tasks[0].stoppedReason)
            if [[ "$stop_log" == *"$error_stop"* ]]; then
                arn_task=$(aws ecs list-task-definitions --family-prefix $FML --max-items 1 --sort DESC --query taskDefinitionArns[0])
                regex_3='\/\w+\-\w+:\w+'
                regex_4='\w+\-\w+:\w+'

                [[ $arn_task =~ $regex_3 ]]
                raw_task_def="${BASH_REMATCH[0]}"

                [[ $raw_task_def =~ $regex_4 ]]
                task_def="${BASH_REMATCH[0]}"
                
                echo $task_def

                ecs-cli logs --task-id $task --task-def $task_def --cluster $CLUSTER --region ap-southeast-1  >> backend.log      
                echo 'ERROR=error' >> error.txt
                break
            fi
        fi
    done
else
    for out in {1..10}
    do
        test_log=$(aws ecs describe-services --cluster $CLUSTER --service backend --query services[0].events[$out])
        if [[ "$test_log" == *"has started 1 tasks"* ]]; then
            message=$(aws ecs describe-services --cluster $CLUSTER --service backend --query services[0].events[$out].message) 
            echo "$message"
            regex_1='\w+\)\.'
            regex_2='\w+'
            [[ $message =~ $regex_1 ]]
            raw_task="${BASH_REMATCH[0]}"
            [[ $raw_task =~ $regex_2 ]]
            task="${BASH_REMATCH[0]}"
            echo "$task"
            break
        fi
    done
    terraform output -json | jq -r '@sh "task_def=\(.task_definition.value)"' > tf.sh
    source tf.sh
    echo $task_def
    ecs-cli logs --task-id $task --task-def $FML:$task_def --cluster $CLUSTER --region ap-southeast-1  >> backend.log
    echo 'ERROR=no' >> error.txt
fi

