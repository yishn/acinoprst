import {h, Component} from 'preact'

const standardRenderers = {
    root: 'span',
    code: 'code',
    link: ({href, children}) => <a href={href} title={href} target="_blank">{children}</a>,
    strong: 'strong',
    em: 'em'
}

function inlineMarkdown2jsx(source, renderers) {
    let rules = [
        {name: 'code', regex: /^`([^`]*)`/},
        {name: 'link', regex: /^!?\[([^\]]*)\]\((((ht|f)tps?:|mailto:)[^)]*)\)/},
        {name: 'emstrong', regex: /^\*\*\*(.*?)\*\*\*(?!\*)/},
        {name: 'emstrong', regex: /^___(.*?)___(?!_)/},
        {name: 'strong', regex: /^\*\*(.*?)\*\*(?!\*)/},
        {name: 'strong', regex: /^__(.*?)__(?!_)/},
        {name: 'em', regex: /^\*(.*?)\*(?!\*)/},
        {name: 'em', regex: /^_(.*?)_(?!_)/}
    ]

    let render = source => inlineMarkdown2jsx(source, renderers)
    let result = []

    while (source.length > 0) {
        let rule = null
        let match = null

        for (let {name, regex} of rules) {
            match = source.match(regex)

            if (match != null) {
                rule = {name, regex}
                break
            }
        }

        if (match != null) {
            if (rule.name === 'code') {
                result.push(h(renderers[rule.name], {}, match[1]))
            } else if (rule.name === 'link') {
                result.push(h(renderers[rule.name], {href: match[2]}, render(match[1])))
            } else if (rule.name === 'strong' || rule.name === 'em') {
                result.push(h(renderers[rule.name], {}, render(match[1])))
            } else if (rule.name === 'emstrong') {
                result.push(h(renderers.em, {}, h(renderers.strong, {}, render(match[1]))))
            }

            source = source.slice(match[0].length)
        } else {
            let lastToken = result[result.length - 1]
            if (typeof lastToken !== 'string') result.push('')

            let match = source.match(/^[^`!\[\*_]+|./)
            result[result.length - 1] += source.slice(0, match[0].length)

            source = source.slice(match[0].length)
        }
    }

    return result
}

export default class InlineMarkdown extends Component {
    render() {
        let {source = '', renderers = {}} = this.props

        return h(renderers.root, {}, inlineMarkdown2jsx(source, {...renderers, ...standardRenderers}))
    }
}
