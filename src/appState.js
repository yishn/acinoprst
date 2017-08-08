import * as github from './github'
import * as outline from './outline'
import * as storage from './storage'

let lastHistoryPointTime = new Date()

export const initState = {
    authorization: null,
    busy: false,
    sidebarWidth: storage.get('sidebarWidth') || 200,
    needPush: false,

    history: [{
        current: 0,
        files: [],
        selectionStart: 0,
        selectionEnd: 0
    }],
    historyPointer: 0,

    current: 0,
    files: [],
    selectionStart: 0,
    selectionEnd: 0
}

export function logout(state) {
    storage.remove('authorization')
    github.logout()

    return {authorization: null, files: []}
}

export function login(state, user, password) {
    storage.set('authorization', [user, password])
    github.login(user, password)

    return {authorization: [user, password]}
}

export function setSidebarWidth(state, width) {
    let sidebarWidth = Math.min(Math.max(width, 153), 400)
    storage.set('sidebarWidth', sidebarWidth)

    return {sidebarWidth}
}

export function setFileTitle(state, index, title) {
    if (state.files[index].title === title) return state

    let files = state.files.map((x, i) => i === index ? {...x, title} : x)

    return {
        ...makeHistoryPoint(state, {files}),
        ...setNeedPush(state, true),
        files
    }
}

export function setFileContent(state, index, content, selectionStart, selectionEnd) {
    if (state.files[index].content === content) return state

    let files = state.files.map((x, i) => i === index ? {...x, content} : x)

    return {
        ...makeHistoryPoint(state, {files, selectionStart, selectionEnd}),
        ...setSelection(state, selectionStart, selectionEnd),
        ...setNeedPush(state, true),
        files
    }
}

export function setSelection(state, selectionStart, selectionEnd) {
    return {selectionStart, selectionEnd}
}

export function setBusy(state, busy) {
    return {busy}
}

export function setNeedPush(state, needPush) {
    return {needPush}
}

export function loadFiles(state, files) {
    let filesState = {
        ...setSelection(state, 0, 0),
        current: 0,
        files
    }

    return {
        ...filesState,
        history: [filesState],
        historyPointer: 0,
        needPush: false
    }
}

export function openFile(state, index) {
    if (index === state.current) return state

    return {
        ...makeHistoryPoint(state, {current: index}),
        current: index,
        selectionStart: 0,
        selectionEnd: 0
    }
}

export function newFile(state) {
    let files = [...state.files, {title: '', content: ''}]
    let current = state.files.length

    return {
        ...makeHistoryPoint(state, {current, files}),
        ...setSelection(state, 0, 0),
        ...setNeedPush(state, true),
        current, files
    }
}

export function removeFile(state, index) {
    let files = state.files.filter((_, i) => i !== index)
    let current = state.current !== index ? state.current : Math.max(state.current - 1, 0)

    return {
        ...makeHistoryPoint(state, {current, files}),
        ...setSelection(state, 0, 0),
        ...setNeedPush(state, true),
        current, files
    }
}

export function permutateFiles(state, permutation) {
    if (permutation.every((x, i, a) => i === 0 || x > a[i - 1])) return state

    let files = permutation.map(i => state.files[i])
    let current = permutation.indexOf(state.current)

    return {
        ...makeHistoryPoint(state, {current, files}),
        ...setNeedPush(state, true),
        current, files
    }
}

export function reformat(state, index) {
    return setFileContent(state, index, outline.reformat(state.files[index].content))
}

export function separateItems(state, index) {
    return setFileContent(state, index, outline.separate(state.files[index].content))
}

export function removeDoneTasks(state, index) {
    return setFileContent(state, index, outline.removeDoneTasks(state.files[index].content))
}

export function makeHistoryPoint(state, {
    current = null,
    files = null,
    selectionStart = null,
    selectionEnd = null
}) {
    let history = state.history
    let currentDate = new Date()

    if (state.historyPointer < state.history.length - 1) {
        history.splice(state.historyPointer + 1, history.length)
    }

    if (current == null) current = state.current
    if (files == null) files = state.files
    if (selectionStart == null) selectionStart = state.selectionStart
    if (selectionEnd == null) selectionEnd = state.selectionEnd

    let data = {current, files, selectionStart, selectionEnd}

    if (currentDate.getTime() - lastHistoryPointTime.getTime() < 500) {
        history[history.length - 1] = data
    } else {
        history.push(data)
    }

    lastHistoryPointTime = currentDate

    return {history, historyPointer: history.length - 1}
}

export function traverseEditHistory(state, step) {
    let historyPointer = state.historyPointer + step

    if (historyPointer < 0 || historyPointer >= state.history.length) {
        return state
    }

    let {current, files, selectionStart, selectionEnd} = state.history[historyPointer]

    return {historyPointer, current, files, selectionStart, selectionEnd}
}
