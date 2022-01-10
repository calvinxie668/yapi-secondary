let recordList = [];
self.FILTERED_RECORD_LIST = [];
const defaultLimit = 100;
self.beginIndex = 0;
self.refreshing = true;
self.endIndex = self.beginIndex + defaultLimit - 1;
self.currentStateData = [];
self.IN_DIFF = false; // mark if currently in diff working

// diff the record, so when the refreshing is stoped, the page will not be updated
// cause the filtered records will be unchanged
self.diffRecords = function () {
    if(self.IN_DIFF) {
        return;
    }
    self.IN_DIFF = true;
    let shouldUpdateRecord = false;

    self.FILTERED_RECORD_LIST= []
    for (let i = 0; i < recordList.length; i++) {
        const item = recordList[i];
        self.FILTERED_RECORD_LIST.push(item);
    }
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
            if(item.id !== targetItem.id) {
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

self.addEventListener('message', e => {
    const data = JSON.parse(e.data);
    switch (data.type) {
        case 'initRecord': {
            recordList = data.data;
            self.diffRecords();
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
