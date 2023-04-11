#!/bin/bash
cp var.env terraform.tfvars

ACCESS_KEY=$(echo "$ACCESS_KEY" | sed 's/\//\\\//g' )
SECRET_KEY=$(echo "$SECRET_KEY" | sed 's/\//\\\//g' )
AWS_S3_KEY_SECRET=$(echo "$AWS_S3_KEY_SECRET" | sed 's/\//\\\//g' )
S3_URL=$(echo "$S3_URL" | sed 's/\//\\\//g' )
USER_DB=$(echo "$USER_DB" | sed 's/\//\\\//g' )
VAULT_URL=$(echo "$VAULT_URL" | sed 's/\//\\\//g' )
AUTH0_AUDIENCE=$(echo "$AUTH0_AUDIENCE" | sed 's/\//\\\//g' )
AUTH0_ISSUER_URL=$(echo "$AUTH0_ISSUER_URL" | sed 's/\//\\\//g' )

sed "s/PUBLIC_AWS_S3_BUCKET/$PUBLIC_AWS_S3_BUCKET/g" -i terraform.tfvars
sed "s/PRIVATE_AWS_S3_BUCKET/$PRIVATE_AWS_S3_BUCKET/g" -i terraform.tfvars

sed "s/AWS_ACCESS_KEY/$ACCESS_KEY/g" -i terraform.tfvars
sed "s/AWS_SECRET_KEY/$SECRET_KEY/g" -i terraform.tfvars
sed "s/PASSWORD_DATABASE/$PASS_DB/g" -i terraform.tfvars
sed "s/NAME_DATABASE/$NAME_DB/g" -i terraform.tfvars
sed "s/USER_NAME_DB/$USER_DB/g" -i terraform.tfvars
sed "s/COINGECKO_API_KEY/$COINGECKO_API_KEY/g" -i terraform.tfvars
sed "s/ETHERSCAN_API_KEY/$ETHERSCAN_API_KEY/g" -i terraform.tfvars
sed "s/ALCHEMY_INGESTION_API_KEY/$ALCHEMY_INGESTION_API_KEY/g" -i terraform.tfvars
sed "s/POLYGONSCAN_API_KEY/$POLYGONSCAN_API_KEY/g" -i terraform.tfvars
sed "s/BSCSCAN_API_KEY/$BSCSCAN_API_KEY/g" -i terraform.tfvars
sed "s/AWS_S3_BUCKET/$AWS_S3_BUCKET/g" -i terraform.tfvars
sed "s/AWS_S3_ACCESS_KEY/$AWS_S3_ACCESS_KEY/g" -i terraform.tfvars
sed "s/AWS_S3_KEY_SECRET/$AWS_S3_KEY_SECRET/g" -i terraform.tfvars
sed "s/AWS_S3_REGION/$AWS_S3_REGION/g" -i terraform.tfvars
sed "s/S3_URL/$S3_URL/g" -i terraform.tfvars
sed "s/VAULT_URL/$VAULT_URL/g" -i terraform.tfvars
sed "s/VAULT_VERSION/$VAULT_VERSION/g" -i terraform.tfvars
sed "s/VAULT_ROLE_ID/$VAULT_ROLE_ID/g" -i terraform.tfvars
sed "s/VAULT_SECRET_ID/$VAULT_SECRET_ID/g" -i terraform.tfvars
sed "s/VAULT_NAMESPACE/$VAULT_NAMESPACE/g" -i terraform.tfvars
sed "s/VAULT_ENV/$VAULT_ENV/g" -i terraform.tfvars
sed "s/AUTH0_AUDIENCE/$AUTH0_AUDIENCE/g" -i terraform.tfvars
sed "s/AUTH0_ISSUER_URL/$AUTH0_ISSUER_URL/g" -i terraform.tfvars


IMAGE_BE="${IMAGE_BE%\"}"
IMAGE_BE="${IMAGE_BE#\"}"
IMAGE_BE=$(echo "$IMAGE_BE" | sed 's/\//\\\//g' )
sed "s/IMAGE_BACKEND/$IMAGE_BE/g" -i terraform.tfvars

cp cfbackend.env cfbackend.tfvars
sed "s/TERRAFORM_STATE_BUCKET_NAME/$TERRAFORM_STATE_BUCKET_NAME/g" -i cfbackend.tfvars
