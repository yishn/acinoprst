const {h, Component} = require('preact')

export default class Headline {
    render() {
        return <section id="headline">
            <span class="hash">#</span>
            
            <input
                type="text"
                value={this.props.value}
                placeholder="Title"
            />
        </section>
    }
}
