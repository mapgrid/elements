<script>
    import { Machine, interpret } from 'xstate'
    import { onMount } from 'svelte'

    import formData from './form-data'

    export let endpoint

    const submissionMachine = Machine({
        id: 'submission',
        initial: 'idle',
        states: {
            idle: {
                on: {
                    SUBMIT: 'submitting',
                },
            },
            submitting: {
                on: {
                    RESOLVE: 'submitted',
                    REJECT: 'failure',
                },
            },
            submitted: {},
            failure: {
                on: {
                    SUBMIT: 'submitting',
                    HIDE: 'idle',
                },
                after: {
                    5000: 'idle',
                },
            },
        },
    })

    let state = submissionMachine.initialState.value
    let service = interpret(submissionMachine).onTransition(
        ctx => (state = ctx.value),
    )

    function handleSubmit(e) {
        service.send('SUBMIT')

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(formData(e.target)),
        })
            .then(res => res.json().then(json => ({ json, ok: res.ok })))
            .then(({ json, ok }) => {
                if (ok) {
                    service.send('RESOLVE')
                } else {
                    service.send('REJECT')
                }
            })
            .catch(() => {
                service.send('REJECT')
            })
    }

    onMount(() => {
        service.start()
    })
</script>

<form on:submit|preventDefault={handleSubmit}>
    <slot state={state}></slot>
</form>
