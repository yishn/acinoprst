import {h, render} from 'preact'
import * as outline from './outline'

let list = outline.parse([
    '- [ ] Hello',
    '    - [x] World',
    '    + [ ] World2',
    '     - [ X] Bam',
    '- [ ] Hi'
].join('\n'))

let newList = outline.move((
    outline.update(list, 3, {checked: false})
), 3, 'in', 4)

render(<div>
    <pre>
        {outline.stringify(newList)}
    </pre>
    <pre>
        {outline.stringify(list)}
    </pre>
</div>, document.body)
