<script lang="ts">
  interface Props {
    onRefresh: () => void;
  }

  let { onRefresh }: Props = $props();
</script>

<header class="topbar">
  <div class="topbar-branding">
    <h1><span class="product-badge">QCY</span> Quincy</h1>
    <div class="project-selector-summary" aria-label="Active project">
      <div class="project-selector-path">/Volumes/sourcecode/personal/quincy</div>
      <button type="button" class="project-selector-status refresh-link" onclick={onRefresh}>Refresh</button>
    </div>
  </div>

  <div class="toolbar">
    <input aria-label="Search tickets" placeholder="Search id or title" />
  </div>
</header>
