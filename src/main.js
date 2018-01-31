import {h, render} from 'preact'
import * as outline from './outline'

let list = outline.parse([
    '- [ ] Hello',
    '    - [x] World',
    '    + [ ] World2',
    '     - [ X] Bam',
    '- [ ] Hi'
].join('\n'))

let newList = outline.insert((
    outline.update(list, 3, {checked: false})
), 3, 'in', 4)

render(<div>
    <pre>
        {JSON.stringify(newList, null, '  ')}
    </pre>
    <pre>
        {JSON.stringify(list, null, '  ')}
    </pre>
</div>, document.body)
