#!/bin/bash
echo '执行自动化部署命令开始'

WORK_DIR='vendors'

if [ $1 ];then 
cd $1 
else
echo '缺少目录参数'
exit 1
fi

echo '安装依赖'
npm install 
echo '执行pathc'
npm run postinstall
echo '开始打包...'
ykit pack -m

cd ..

if [ ! -d $(pwd)'/'$WORK_DIR'/' ];then
echo ''$WORK_DIR'文件夹不存在'
exit 1
else
echo '清空'$WORK_DIR'文件夹'
rm -rf $WORK_DIR/*
fi

echo 'copy '$1'新文件到'$WORK_DIR'文件夹'
/bin/cp -rf $1/*  $WORK_DIR/ || echo 'copy file failed'

echo '重启node服务'
pm2 delete all 
pm2 start -i 1 ./$WORK_DIR/server/app.js --name yapi 
echo '自动化部署结束'