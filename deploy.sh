#!/bin/bash
echo '执行自动化部署命令开始'

WORK_DIR='vendors'

cd $1
npm install 
npm run postinstall
ykit pack -m

cd ..

if [ ! -d $(pwd)'/'$WORK_DIR'/' ];then
echo 'vendors文件夹不存在'
exit 
else
echo '清空vendors文件夹'
rm -rf $WORK_DIR/*
fi

echo 'copy '$1'新文件到'$WORK_DIR'文件夹'
/bin/cp -rf $1/*  $WORK_DIR/*

echo '重启node服务'
pm2 delete all 
pm2 start -i 2 ./$WORK_DIR/server/app.js --name yapi 
echo '自动化部署结束'