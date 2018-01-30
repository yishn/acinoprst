import {h, render} from 'preact'
import * as outline from './outline'

let list = outline.parse([
    '- [ ] Hello',
    '    - [x] World',
    '    + [ ] World2',
    '     - [ X] Bam',
    '- [ ] Hi'
].join('\n'))

render(<div>
    <pre>
        {outline.stringify(outline.update(list, 3, {checked: false}))}
    </pre>
    <pre>
        {outline.stringify(list)}
    </pre>
</div>, document.body)
