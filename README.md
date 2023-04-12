# digital-barcode

## How to deploy

Make sure to have pem file saved some place in disk

```bash
sudo ssh -i <Path to pem file> ec2-user@ec2-34-222-158-209.us-west-2.compute.amazonaws.com

cd digital-barcode/packages/ec2/pdf_converter

git fetch
# prompt to enter github token

# checkout to branch to deploy

nvm use 16

pm2 delete all

npm run start
```
