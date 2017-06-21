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
            title: '',
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

export function reformat(state, index) {
    let files = state.files.slice()

    files[index] = Object.assign({}, files[index], {
        content: outline.reformat(files[index].content)
    })

    return {files}
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
