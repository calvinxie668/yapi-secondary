const Safeify = require('safeify').default;

module.exports = async function sandboxFn(context, script) {
    // 创建 safeify 实例
    const safeVm = new Safeify({
        timeout: 3000,
        asyncTimeout: 60000
    })
    // fix error: TypeError: Cannot read property 'delay' of undefined
    script += `\n return {mockJson, resHeader, httpCode, delay}`; 
    // 执行动态代码
    const result = await safeVm.run(script, context)
    // 释放资源
    safeVm.destroy()
    return result
}
