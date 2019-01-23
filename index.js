import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

function parseError(error) {
  let message = 'Error to process the task'
  if (Object.prototype.toString.call(error) === '[object Error]') {
    message = error.message
  } else if (Object.prototype.toString.call(error) === '[object String]') {
    message = error
  } else if (error !== undefined && error !== null) {
    message = JSON.stringify(error)
  }
  return {
    message,
    stack: error.stack || null
  }
}

export default (key, callback) => {
  // Get next task without error
  function nextTask(databaseRef) {
    return databaseRef
      .child('tasks')
      .orderByChild('_error')
      .equalTo(null)
      .limitToFirst(1)
      .once('value')
      .then(res => res.val())
      .then(res => {
        if (!res) return null
        const id = Object.keys(res).pop()
        return { id, task: res[id] }
      })
  }

  async function runTask(databaseRef, options, context) {
    if (!options) return false
    const { id, task } = options
    const { snapshot } = await databaseRef
      .child('current')
      .transaction(p => p || id)
    const current_id = snapshot.val()

    if (current_id !== id) return false

    const updates = { current: null }
    try {
      await callback(task, context)

      updates[`tasks/${id}`] = null
    } catch (error) {
      console.log('ERROR', error)
      updates[`tasks/${id}/_error`] = parseError(error)
    }

    await databaseRef.update(updates)
    return true
  }

  function replaceParams(params = {}) {
    return Object.keys(params).reduce((str, p) => str.replace(`{${p}}`, params[p]), key)
  }

  async function startQueue(snapshot, context) {
    const databaseRef = admin.database().ref(replaceParams(context.params))
    return await runTask(databaseRef, await nextTask(databaseRef), context)
  }

  const onCreateTask = functions.database
    .ref(`/${key}/tasks/{id}`)
    .onCreate(startQueue)

  const onFinishTask = functions.database
    .ref(`/${key}/current`)
    .onDelete(startQueue)

  const onRetryTask = functions.database
    .ref(`/${key}/tasks/{id}/_error`)
    .onDelete(startQueue)

  return { onCreateTask, onFinishTask, onRetryTask }
}
