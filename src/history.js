export default class History {
    constructor({delay = 500} = {}) {
        this.history = []
        this.pointer = -1
        this.delay = delay
    }

    clear() {
        this.history.length = 0
    }

    push(data) {
        let timestamp = Date.now()
        let lastEntry = this.history[this.pointer]

        if (lastEntry != null) {
            let overwrite = data === lastEntry.data || timestamp - lastEntry.timestamp < this.delay
            this.history.length = +!overwrite + this.pointer
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

    isUndoable() {
        return this.pointer > 0
    }

    isRedoable() {
        return this.pointer < this.history.length - 1
    }

    undo() {
        return this.step(-1)
    }

    redo() {
        return this.step(1)
    }
}
