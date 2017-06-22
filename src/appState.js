import * as outline from './outline'

export const initState = {
    current: 0,
    files: [
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

export function reformat(state, index = null) {
    return {
        files: state.files.map((x, i) => index == null || index === i
            ? Object.assign({}, x, {content: outline.reformat(x.content)})
            : x
        )
    }
}

export function openFile(state, index) {
    return Object.assign(reformat(state, index), {current: index})
}

export function newFile(state) {
    return {
        files: [...state.files, {title: '', content: ''}],
        current: state.files.length
    }
}

export function removeFile(state, index = null) {
    if (index == null) index = state.current

    if (state.files.length > 1) {
        return {
            files: state.files.filter((_, i) => i !== index),
            current: state.current !== index ? state.current : Math.max(state.current - 1, 0)
        }
    }

    return newFile(Object.assign({}, state, {files: []}))
}

export function permutateFiles(state, permutation) {
    return {
        files: permutation.map(i => state.files[i]),
        current: permutation.indexOf(state.current)
    }
}
