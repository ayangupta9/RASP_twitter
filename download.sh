#!/bin/bash
cd ./python_server

curl -L -o BEit_XAI.zip https://owncloud.gwdg.de/index.php/s/maDTUXKW0YKL5Tg/download

ZIP_FILE="Beit_XAI.zip"
unzip "$ZIP_FILE"

echo "Unzipped $ZIP_FILE"