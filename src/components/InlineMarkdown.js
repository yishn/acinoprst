import {h, Component} from 'preact'

const standardRenderers = {
    root: 'span',
    code: 'code',
    link: ({href, children}) => <a href={href} title={href} target="_blank">{children}</a>,
    strong: 'strong',
    em: 'em'
}

const markdownRules = [
    {name: 'code', regex: /^`([^`]*)`/},
    {name: 'link', regex: /^!?\[([^\]]*)\]\((((ht|f)tps?:|mailto:)[^)]*)\)/},
    {name: 'url', regex: /^((ht|f)tps?:\/\/[^\s<]+[^<.,:;"\')\]\s](\/\B|\b))/},
    {name: 'email', regex: /^([^\s@<]+@[^\s@<]+)\b/},
    {name: 'strong', regex: /^\*\*(\*?[^\*]([^\*](\*(?!\*))?)*\*?)\*\*/},
    {name: 'strong', regex: /^__(_?[^_]([^_](_(?!_))?)*_?)__/},
    {name: 'em', regex: /^\*(([^\*]|\*\*)+)\*/},
    {name: 'em', regex: /^_(([^_]|__)+)_/},
    {name: 'text', regex: /^[^`!\[\*_\w]+|\w+|./}
]

function inlineMarkdown2jsx(source, renderers, ignore = []) {
    let render = (source, ignoreMore) => inlineMarkdown2jsx(source, renderers, [...ignore, ...ignoreMore])
    let result = []

    while (source.length > 0) {
        let rule = null
        let match = null
        let quality = -Infinity

        for (let {name, regex} of markdownRules) {
            if (ignore.includes(name)) continue
            let ruleMatch = source.match(regex)

            if (ruleMatch != null && quality < ruleMatch[0].length) {
                rule = {name, regex}
                match = ruleMatch
                quality = ruleMatch[0].length
            }
        }

        if (rule.name === 'code') {
            result.push(h(renderers.code, {}, match[1]))
        } else if (rule.name === 'link') {
            result.push(h(renderers.link, {href: match[2]}, render(match[1], ['link', 'url', 'email'])))
        } else if (rule.name === 'url') {
            result.push(h(renderers.link, {href: match[1]}, match[1]))
        } else if (rule.name === 'email') {
            result.push(h(renderers.link, {href: `mailto:${match[1]}`}, match[1]))
        } else if (rule.name === 'strong' || rule.name === 'em') {
            result.push(h(renderers[rule.name], {}, render(match[1], [rule.name])))
        } else if (rule.name === 'text') {
            let [lastToken] = result.slice(-1)
            if (typeof lastToken !== 'string') result.push('')

            result[result.length - 1] += source.slice(0, match[0].length)
        }

        source = source.slice(match[0].length)
    }

    return result
}

export default class InlineMarkdown extends Component {
    shouldComponentUpdate({source, renderers}) {
        return source !== this.props.source
            || renderers !== this.props.renderers
            && Object.keys(standardRenderers).some(key => renderers[key] !== this.props.renderers[key])
    }

    render() {
        let {source = '', renderers = {}} = this.props

        return h(renderers.root, {}, inlineMarkdown2jsx(source, {...renderers, ...standardRenderers}))
    }
}
