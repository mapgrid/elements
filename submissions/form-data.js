export default form => {
    const fields = form.querySelectorAll('input, select, textarea')
    const o = {}

    for (let i = 0; i < fields.length; i += 1) {
        const field = fields[i]

        if (
            field.type === 'button' ||
            field.type === 'image' ||
            field.type === 'submit' ||
            !field.name
        ) {
            // eslint-disable-next-line no-continue
            continue
        }

        const a = []

        switch (field.type) {
            case 'checkbox':
                o[field.name] = field.checked
                break
            case 'radio':
                if (o[field.name] === undefined) {
                    o[field.name] = ''
                }

                if (field.checked) {
                    o[field.name] = field.value
                }
                break
            case 'select-multiple':
                for (let j = 0; j < field.options.length; j += 1) {
                    if (field.options[j].selected) {
                        a.push(field.options[j].value)
                    }
                }
                o[field.name] = a
                break
            default:
                o[field.name] = field.value
        }
    }

    return o
}
