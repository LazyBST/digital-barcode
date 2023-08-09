sudo yum install git -y
git clone https://github.com/ennovatechlabs/digital-barcode.git

sudo yum install -y gcc-c++
sudo yum groupinstall 'Development Tools'

sudo yum install ImageMagick cmake
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
nvm install 16
npm i

cd digital-barcode/packages/ec2/pdf_converter/

yum install gcc
./configure