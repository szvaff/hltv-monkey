import $ from 'jquery'

export function Crawler() {
  var queue = [];
  var inProgress = null;

  Crawler.prototype.queue = function(url) {
    var toResolveLater = null;
    var promise = new Promise((resolve, reject) => {
      toResolveLater = resolve;
    });

    queue.push({
      url: url,
      promise: promise,
      resolve: toResolveLater
    })

    next();
    return promise;
  }

  function next() {
    return new Promise(resolve => {
      if(inProgress !== null) {
        inProgress.promise.then(() => {
          next();
        })
        return;
      }

      if (queue.length === 0) {
        resolve();
        return;
      }

      inProgress = queue[0];
      setTimeout(() => {
        $.get(inProgress.url).then(result => {
          resolve(result);
          inProgress.resolve(result);
          queue.splice(0,1);
          inProgress = null;
        })
      }, 500)
    })
  }

  return this;
}