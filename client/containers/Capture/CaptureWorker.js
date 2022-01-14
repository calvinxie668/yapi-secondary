let recordList = [];
self.FILTERED_RECORD_LIST = [];
const defaultLimit = 100;
self.beginIndex = 0;
self.refreshing = true;
self.endIndex = self.beginIndex + defaultLimit - 1;
self.currentStateData = [];
self.updateQueryTimer = null;
self.filterObj = {};
self.IN_DIFF = false; // mark if currently in diff working

// diff the record, so when the refreshing is stoped, the page will not be updated
// cause the filtered records will be unchanged
const getFilterReg = function (filterStr) {
    let filterReg = null;
    if (filterStr) {
      let regFilterStr = filterStr
        .replace(/\r\n/g, '\n')
        .replace(/\n\n/g, '\n');
  
      // remove the last /\n$/ in case an accidential br
      regFilterStr = regFilterStr.replace(/\n*$/, '');
  
      if (regFilterStr[0] === '/' && regFilterStr[regFilterStr.length - 1] === '/') {
        regFilterStr = regFilterStr.substring(1, regFilterStr.length - 2);
      }
  
      regFilterStr = regFilterStr.replace(/((.+)\n|(.+)$)/g, (matchStr, $1, $2) => {
        // if there is '\n' in the string
        if ($2) {
          return `(${$2})|`;
        } else {
          return `(${$1})`;
        }
      });
  
      try {
        filterReg = new RegExp(regFilterStr);
      } catch (e) {
        console.error(e);
      }
    }
  
    return filterReg;
};

self.resetDisplayRecordIndex = function () {
    self.beginIndex = 0;
    self.endIndex = self.beginIndex + defaultLimit - 1;
};

self.calculateFilteredRecords = function (isFullyCalculate, listForThisTime = []) {
    if (isFullyCalculate) {
        self.FILTERED_RECORD_LIST = [];
        console.log(self.filterObj.type)
        if(self.filterObj.type != 'all') {
            recordList = recordList.filter(item => item.type == self.filterObj.type);
        }
        console.log(recordList)
        const length = recordList.length;
        // filtered out the records
        for (let i = 0; i < length; i++) {
            const item = recordList[i];
            const itemStr = JSON.stringify(item);
            if(!self.filterObj['requestMsgType'] || (item['request'] && item['request'].hasOwnProperty('requestMsgType') && item['request']['requestMsgType'] === self.filterObj['requestMsgType']) || (item && item.hasOwnProperty('topicId') && item['topicId'] === self.filterObj['requestMsgType'])) {
                if(!self.filterObj['responseMsgType'] || (item['response'] && item['response'].hasOwnProperty('responseMsgType') && item['response']['responseMsgType'] === self.filterObj['responseMsgType']) || (item && item.hasOwnProperty('msgType') && item['msgType'] === self.filterObj['responseMsgType'])) {
                    if(!self.filterObj['key1'] || getFilterReg(self.filterObj['key1']).test(itemStr)) {
                        if(!self.filterObj['key2'] || getFilterReg(self.filterObj['key2']).test(itemStr)) {
                            if(!self.filterObj['key3'] || getFilterReg(self.filterObj['key3']).test(itemStr)) {
                                self.FILTERED_RECORD_LIST.push(item);
                            }
                        }
                    }
                } 
            }
        }
    } else {
        listForThisTime.forEach((item) => {
          const index = self.FILTERED_RECORD_LIST.findIndex((record) => {
            return item.id === record.id;
          });
    
          if (index >= 0) {
            self.FILTERED_RECORD_LIST[index] = item;
          } else {
            if(!self.filterObj['requestMsgType'] || (item['request'] && item['request'].hasOwnProperty('requestMsgType') && item['request']['requestMsgType'] === self.filterObj['requestMsgType']) || (item && item.hasOwnProperty('topicId') && item['topicId'] === self.filterObj['requestMsgType'])) {
                if(!self.filterObj['responseMsgType'] || (item['response'] && item['response'].hasOwnProperty('responseMsgType') && item['response']['responseMsgType'] === self.filterObj['responseMsgType']) || (item && item.hasOwnProperty('msgType') && item['msgType'] === self.filterObj['responseMsgType'])) {
                    if(!self.filterObj['key1'] || getFilterReg(self.filterObj['key1']).test(itemStr)) {
                        if(!self.filterObj['key2'] || getFilterReg(self.filterObj['key2']).test(itemStr)) {
                            if(!self.filterObj['key3'] || getFilterReg(self.filterObj['key3']).test(itemStr)) {
                                self.FILTERED_RECORD_LIST.push(item);
                            }
                        }
                    }
                } 
            }
          }
        });
    }
}

self.diffRecords = function () {
    if(self.IN_DIFF) {
        return;
    }
    self.IN_DIFF = true;
    let shouldUpdateRecord = false;

    // self.FILTERED_RECORD_LIST= []
    // for (let i = 0; i < recordList.length; i++) {
    //     const item = recordList[i];
    //     self.FILTERED_RECORD_LIST.push(item);
    // }
    if(self.refreshing) {
        self.beginIndex = Math.max(self.FILTERED_RECORD_LIST.length - 1 - defaultLimit, 0);
        self.endIndex = self.FILTERED_RECORD_LIST.length - 1; 
    } else {
        if(self.endIndex > self.FILTERED_RECORD_LIST.length) {
            self.endIndex = self.FILTERED_RECORD_LIST.length;
        } 
    }

    const newStateRecords = self.FILTERED_RECORD_LIST.slice(self.beginIndex, self.endIndex + 1);
    const currentDataLength = self.currentStateData.length;
    const newDataLength = newStateRecords.length;

    if(newDataLength !== currentDataLength) {
        shouldUpdateRecord = true;
    } else {
        for(let i = 0; i < currentDataLength; i++) {
            const item = self.currentStateData[i];
            const targetItem = newStateRecords[i];
            if(item.id !== targetItem.id || targetItem._render === true) {
                shouldUpdateRecord = true;
                break;
            }
        }
    }

    self.currentStateData = newStateRecords;

    self.postMessage(JSON.stringify({
        type: 'updateData',
        shouldUpdateRecord,
        recordList: newStateRecords
    }));
    self.IN_DIFF = false;
}

// check if there are many new records arrivied
self.checkNewRecordsTip = function () {
    if (self.IN_DIFF) {
      return;
    }
  
    const newRecordLength = self.FILTERED_RECORD_LIST.length;
    self.postMessage(JSON.stringify({
      type: 'updateTip',
      data: (newRecordLength - self.endIndex) > 0
    }));
};

self.updateSingle = function (record) {
    recordList.forEach((item) => {
      item._render = false;
    });
  
    const index = recordList.findIndex((item) => {
      return item.id === record.id;
    });
  
    if (index >= 0) {
      // set the mark to ensure the item get re-rendered
      record._render = true;
      recordList[index] = record;
    } else {
      recordList.push(record);
    }
    self.calculateFilteredRecords(false, [record]);
};

self.addEventListener('message', e => {
    const data = JSON.parse(e.data);
    switch (data.type) {
        case 'initRecord': {
            recordList = data.data;
            self.calculateFilteredRecords(true);
            self.diffRecords();
            break;
        }

        case 'updateQuery': {
            // if filterStr or limit changed
               self.refreshing = data.refreshing;
            // if (data.filterStr !== self.filterStr) {
              self.updateQueryTimer && clearTimeout(self.updateQueryTimer);
              self.updateQueryTimer = setTimeout(() => {
                self.resetDisplayRecordIndex();
                self.filterObj = data.filterObj;
                self.calculateFilteredRecords(true);
                self.diffRecords();
              }, 150);
            // }
            break;
        }

        case 'updateSingle': {
            self.updateSingle(data.data);
            if (self.refreshing) {
              self.diffRecords();
            } else {
              self.checkNewRecordsTip();
            }
            break;
        }

        case 'loadMore': {
            if (self.IN_DIFF) {
              return;
            }
            self.refreshing = false;
            if (data.data > 0) {
              self.endIndex += data.data;
            } else {
              self.beginIndex = Math.max(self.beginIndex + data.data, 0);
            }
            self.diffRecords();
            break;
        }

        case 'clear': {
            recordList = [];
            self.calculateFilteredRecords(true);
            self.diffRecords();
            break;
        }

        case 'updateRefreshing': {
            if (typeof data.refreshing === 'boolean') {
              self.refreshing = data.refreshing;
              if (self.refreshing) {
                self.diffRecords();
              } else {
                self.checkNewRecordsTip();
              }
            }
            break;
          }
        default: {
            break;
        }
    }
})
