export default class History {
    constructor({delay = 500} = {}) {
        this.history = []
        this.pointer = -1
        this.delay = delay
    }

    push(data) {
        let timestamp = Date.now()
        let lastEntry = this.history[this.pointer]

        if (lastEntry != null) {
            if (data === lastEntry.data || timestamp - lastEntry.timestamp < this.delay)
                return this

            this.history.length = this.pointer + 1
        }

        this.history.push({data, timestamp})
        this.pointer = this.history.length - 1

        return this
    }

    step(step) {
        let entry = this.history[this.pointer + step]
        if (entry == null) return null

        this.pointer += step

        return entry.data
    }

    undo() {
        return this.step(-1)
    }

    redo() {
        return this.step(1)
    }
}
