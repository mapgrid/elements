<script>
    import Tracker from './tracker'

    export let siteId
    export let trackerUrl
    export let path

    $: tracker = new Tracker(siteId, trackerUrl)
    $: tracker.trackPageview(path)
</script>
