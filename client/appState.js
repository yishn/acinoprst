import cookies from 'js-cookie'
import * as outline from './outline'

let lastHistoryPointTime = new Date()

export const initState = {
    loggedIn: cookies.get('access_token') != null,
    sidebarWidth: 200,

    history: [{
        current: 0,
        files: [{title: '', content: ''}],
        selectionStart: 0,
        selectionEnd: 0
    }],
    historyPointer: 0,

    current: 0,
    files: [{title: '', content: ''}],
    selectionStart: 0,
    selectionEnd: 0
}

export function updateSidebarWidth(state, width) {
    return {sidebarWidth: Math.min(Math.max(width, 100), 400)}
}

export function updateFileTitle(state, index, title) {
    if (state.files[index].title === title) return state

    let files = state.files.map((x, i) => i === index ? {...x, title} : x)

    return {...makeHistoryPoint(state, {files}), files}
}

export function updateFileContent(state, index, content, selectionStart, selectionEnd) {
    if (state.files[index].content === content) return state

    let files = state.files.map((x, i) => i === index ? {...x, content} : x)

    return {
        ...makeHistoryPoint(state, {files, selectionStart, selectionEnd}),
        ...updateSelection(state, selectionStart, selectionEnd),
        files
    }
}

export function updateSelection(state, selectionStart, selectionEnd) {
    return {selectionStart, selectionEnd}
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
        ...openFile(state, current),
        files
    }
}

export function removeFile(state, index) {
    if (state.files.length > 1) {
        let files = state.files.filter((_, i) => i !== index)
        let current = state.current !== index ? state.current : Math.max(state.current - 1, 0)

        return {
            ...makeHistoryPoint(state, {current, files}),
            ...openFile(state, current),
            files
        }
    }

    return newFile({...state, files: []})
}

export function permutateFiles(state, permutation) {
    if (permutation.every((x, i, a) => i === 0 || x > a[i - 1])) return state

    let files = permutation.map(i => state.files[i])
    let current = permutation.indexOf(state.current)

    return {
        ...makeHistoryPoint(state, {current, files}),
        current, files
    }
}

export function reformat(state, index) {
    return updateFileContent(state, index, outline.reformat(state.files[index].content))
}

export function separateItems(state, index) {
    return updateFileContent(state, index, outline.separate(state.files[index].content))
}

export function removeDoneTasks(state, index) {
    return updateFileContent(state, index, outline.removeDoneTasks(state.files[index].content))
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
