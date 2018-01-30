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
        {JSON.stringify(list, null, '  ')}
    </pre>
    <pre>
        {outline.stringify(list)}
    </pre>
</div>, document.body)
