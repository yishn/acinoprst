import * as outline from './outline'

let lastHistoryPointTime = new Date()

export const initState = {
    current: 0,
    history: [{
        current: 0,
        files: [{title: '', content: ''}],
        selectionStart: 0,
        selectionEnd: 0
    }],
    historyPointer: 0,
    files: [
        {title: '', content: ''},
        {
            title: 'acinoprst todo',
            content: outline.reformat([
                '- [ ] `Outliner`',
                '    - [ ] `Ctrl`-click to mark tasks as done',
                '    - [ ] Automatic reformatting',
                '- [ ] Sidebar',
                '    - [ ] Scrollbar style',
                '    - [x] Reordering',
                '- [ ] Login to GitHub',
                '- [ ] Sync with Gist',
                '- [x] Edit history',
                '    - Undo & Redo',
                '- [x] `CodeTextarea`',
                '- [x] File toolbar in `Headline` component',
                '    - [x] Remove done tasks',
                '    - [x] Move done tasks to the bottom',
                '    - [x] Reformat'
            ].join('\n'))
        },
        {
            title: 'Sample Outline',
            content: outline.reformat([
                '- [ ] Hello World!',
                '    - [x] Hello',
                '        - With some description',
                '    - [ ] World!',
                '        - With some more description',
                '        - With some more description 2'
            ].join('\n'))
        },
        {
            title: 'Testing',
            content: outline.reformat([
                '- [ ] Hello World!',
                '- [x] Hello',
                '    - With some description',
                '- [x] World!',
                '    - With some more description',
                '    - With some more description 2'
            ].join('\n'))
        }
    ],
    sidebarWidth: 200,
    selectionStart: 0,
    selectionEnd: 0
}

export function updateSidebarWidth(state, width) {
    return {sidebarWidth: Math.min(Math.max(width, 100), 400)}
}

export function updateFileTitle(state, index, title) {
    let files = state.files.map((x, i) => i === index ? {...x, title} : x)

    return {...makeHistoryPoint(state, {files}), files}
}

export function updateFileContent(state, index, content, selectionStart, selectionEnd) {
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
    return {current: index, selectionStart: 0, selectionEnd: 0}
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
