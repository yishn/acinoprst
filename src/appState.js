import * as outline from './outline'

export const initState = {
    current: 0,
    files: [
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
                '- [ ] Edit history',
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
    sidebarWidth: 200
}

export function updateSidebarWidth(state, width) {
    return {sidebarWidth: Math.min(Math.max(width, 100), 400)}
}

export function updateHeadline(state, index, title) {
    return {
        files: state.files.map((x, i) => i === index ? {...x, title} : x)
    }
}

export function updateFileContent(state, index, content) {
    return {
        files: state.files.map((x, i) => i === index ? {...x, content} : x)
    }
}

export function reformat(state, index = null) {
    return {
        files: state.files.map((x, i) => index == null || index === i
            ? {...x, content: outline.reformat(x.content)}
            : x
        )
    }
}

export function newFile(state) {
    return {
        files: [...state.files, {title: '', content: ''}],
        current: state.files.length
    }
}

export function openFile(state, index) {
    return {...reformat(state, index), current: index}
}

export function removeFile(state, index) {
    if (state.files.length > 1) {
        return {
            files: state.files.filter((_, i) => i !== index),
            current: state.current !== index ? state.current : Math.max(state.current - 1, 0)
        }
    }

    return newFile({...state, files: []})
}

export function permutateFiles(state, permutation) {
    return {
        files: permutation.map(i => state.files[i]),
        current: permutation.indexOf(state.current)
    }
}

export function separateItems(state, index) {
    return {
        files: state.files.map((x, i) => index === i
            ? {...x, content: outline.separate(x.content)}
            : x
        )
    }
}

export function removeDoneTasks(state, index) {
    return {
        files: state.files.map((x, i) => index === i
            ? {...x, content: outline.removeDoneTasks(x.content)}
            : x
        )
    }
}
