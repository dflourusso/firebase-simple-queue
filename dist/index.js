'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _firebaseFunctions = require('firebase-functions');

var functions = _interopRequireWildcard(_firebaseFunctions);

var _firebaseAdmin = require('firebase-admin');

var admin = _interopRequireWildcard(_firebaseAdmin);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function parseError(error) {
  var message = 'Error to process the task';
  if (Object.prototype.toString.call(error) === '[object Error]') {
    message = error.message;
  } else if (Object.prototype.toString.call(error) === '[object String]') {
    message = error;
  } else if (error !== undefined && error !== null) {
    message = JSON.stringify(error);
  }
  return {
    message: message,
    stack: error.stack || null
  };
}

exports.default = function (key, callback) {
  var databaseRef = admin.database().ref(key);

  // Get next task without error
  function nextTask() {
    return databaseRef.child('tasks').orderByChild('_error').equalTo(null).limitToFirst(1).once('value').then(function (res) {
      return res.val();
    }).then(function (res) {
      if (!res) return null;
      var id = Object.keys(res).pop();
      return { id: id, task: res[id] };
    });
  }

  function runTask(options) {
    var id, task, current_id, updates;
    return Promise.resolve().then(function () {
      if (!options) {
        return false;
      } else {
        return Promise.resolve().then(function () {
          id = options.id;
          task = options.task;
          return new Promise(function (resolve) {
            return databaseRef.child('current').transaction(function (p) {
              var ret = p || id;
              resolve(ret);
              return ret;
            });
          });
        }).then(function (_resp) {
          current_id = _resp;


          if (current_id != id) {
            return false;
          } else {
            return Promise.resolve().then(function () {
              updates = { current: null };
              return Promise.resolve().then(function () {
                return callback(task);
              }).then(function () {

                updates['tasks/' + id] = null;
              }).catch(function (error) {
                console.log('ERROR', error);
                updates['tasks/' + id + '/_error'] = parseError(error);
              });
            }).then(function () {
              return databaseRef.update(updates);
            }).then(function () {
              return true;
            });
          }
        });
      }
    }).then(function () {});
  }

  function startQueue() {
    return Promise.resolve().then(function () {
      return nextTask();
    }).then(function (_resp) {
      return runTask(_resp);
    });
  }

  var onCreateTask = functions.database.ref('/' + key + '/tasks/{id}').onCreate(startQueue);

  var onFinishTask = functions.database.ref('/' + key + '/current').onDelete(startQueue);

  var onRetryTask = functions.database.ref('/' + key + '/tasks/{id}/_error').onDelete(startQueue);

  return { onCreateTask: onCreateTask, onFinishTask: onFinishTask, onRetryTask: onRetryTask };
};