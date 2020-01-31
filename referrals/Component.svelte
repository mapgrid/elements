<style>
    /* purgecss start ignore */
    fieldset {
        @apply flex;
    }

    label {
        @apply block mb-2;
        @apply text-sm font-medium;
        @apply text-alpha-dark-800;
    }

    input {
        @apply flex-1 py-2 px-3 mr-3;
        @apply appearance-none border rounded leading-tight;
        @apply text-alpha-dark-800;
    }

    input::placeholder {
        @apply text-alpha-dark-700;
    }

    input:focus {
        @apply outline-none shadow-outline;
    }

    button {
        @apply py-2 px-6;
        @apply text-sm uppercase rounded font-medium;
        @apply bg-blue-800 text-alpha-light-100;
    }

    button:hover {
        @apply bg-blue-900;
    }

    button:focus {
        @apply outline-none shadow-outline;
    }

    button[disabled] {
        @apply bg-gray-500;
    }

    .error {
        @apply block mt-0;
        @apply text-sm font-medium;
        @apply text-red-500;
        max-height: 0;
        transition: max-height 0.15s ease-out;
        transition: margin-top 0.15s ease-out;
        overflow: hidden;
    }

    .error.visible {
        @apply mt-2;
        max-height: 100px;
    }
    /* purgecss end ignore */
</style>

<script>
    import qs from 'qs'
    import { Machine, interpret } from 'xstate'
    import { onMount } from 'svelte'
    import { fade } from 'svelte/transition'

    export let title
    export let button
    export let endpoint
    export let url

    const signupMachine = Machine({
        id: 'signup',
        initial: 'idle',
        states: {
            idle: {
                on: {
                    SUBMIT: 'creating',
                    LOAD: 'created',
                },
            },
            creating: {
                on: {
                    RESOLVE: 'swap',
                    REJECT: 'failure',
                },
            },
            swap: {
                after: {
                    400: 'created',
                },
            },
            created: {
                on: {
                    COPY: 'copying',
                },
            },
            failure: {
                on: {
                    SUBMIT: 'creating',
                    HIDE: 'idle',
                },
                after: {
                    5000: 'idle',
                },
            },
            copying: {
                after: {
                    400: 'created',
                },
            },
        },
    })

    let state = signupMachine.initialState.value
    let service = interpret(signupMachine).onTransition(
        ctx => (state = ctx.value),
    )

    let linkField
    let referrer
    let link
    let email = ''
    let position
    $: isValid = email.indexOf('@') !== -1
    $: message = isValid
        ? 'Something went wrong. Check your email and try again.'
        : 'Please enter a valid email.'

    function handleSubmit() {
        service.send('SUBMIT')

        if (!isValid) {
            service.send('REJECT')
            return
        }

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({ email, referrer }),
        })
            .then(res => res.json().then(json => ({ json, ok: res.ok })))
            .then(({ json, ok }) => {
                if (ok) {
                    link = `${url}?rf=${json.id}`
                    position = json.position

                    localStorage.setItem('referrals', JSON.stringify({
                        rf: json.id,
                        email,
                        position: json.position,
                    }))

                    service.send('RESOLVE')
                } else {
                    service.send('REJECT')
                }
            })
            .catch(() => {
                service.send('REJECT')
            })
    }

    function handleChange(e) {
        if (state === 'failure') {
            service.send('HIDE')
        }
    }

    function handleFocus() {
        linkField.setSelectionRange(0, linkField.value.length)
    }

    function handleCopy() {
        service.send('COPY')

        if (!navigator.clipboard) {
            fallbackCopyTextToClipboard(link)
            return
        }

        navigator.clipboard.writeText(link)
    }

    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
            document.execCommand('copy')
        } catch (err) {}

        document.body.removeChild(textArea)
    }

    onMount(() => {
        const stored = JSON.parse(localStorage.getItem('referrals'))
        const parsed = qs.parse(window.location.search, { ignoreQueryPrefix: true })
        referrer = parsed.rf

        service.start()

        if (stored) {
            position = stored.position
            email = stored.email
            link = `${url}?rf=${stored.id}`
            service.send('LOAD')
        }
    })
</script>

{#if state === 'created' || state === 'copying'}
<form in:fade>
    <label for="link">
        Share your unique referral link
    </label>
    <fieldset>
        <input
            id="link"
            readonly
            type="text"
            value={link}
            bind:this={linkField}
            on:click={handleFocus}
        />
        <button type="button" on:click|preventDefault={handleCopy}>
            {state === 'copying' ? 'Copied' : 'Copy Link'}
        </button>
    </fieldset>
</form>
{/if}

{#if state === 'idle' || state === 'failure' || state === 'creating'}
<form transition:fade on:submit|preventDefault={handleSubmit}>
    <label for="email">
        {title}
    </label>
    <fieldset>
        <input
            id="email"
            type="text"
            placeholder="john.doe@example.com"
            bind:value={email}
            on:keydown={handleChange}
        />
        <button type="submit" disabled={state === 'creating'}>
            {button}
        </button>
    </fieldset>
    <span class="error" class:visible={state === 'failure'}>
        {message}
    </span>
</form>
{/if}
