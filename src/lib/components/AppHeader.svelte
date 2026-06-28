<script lang="ts">
  import type { SelectableProject } from "$lib/domain/ports";

  interface Props {
    projectPath: string;
    selectableProjects: SelectableProject[];
    onRefresh: () => void;
    onProjectSelect: (projectPath: string) => void;
  }

  let { projectPath, selectableProjects, onRefresh, onProjectSelect }: Props = $props();
  const hasProjectOptions = $derived(selectableProjects.length > 0);

  function selectProject(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    onProjectSelect(select.value);
  }
</script>

<header class="topbar">
  <div class="topbar-branding">
    <h1><span class="product-badge">QCY</span> Quincy</h1>
    <div class="project-selector-summary" aria-label="Active project">
      {#if hasProjectOptions}
        <select class="project-selector-dropdown" aria-label="Active project" value={projectPath} onchange={selectProject}>
          {#each selectableProjects as project}
            <option value={project.root}>{project.label ?? project.root}</option>
          {/each}
        </select>
      {:else}
        <div class="project-selector-path">{projectPath}</div>
      {/if}
      <button type="button" class="project-selector-status refresh-link" onclick={onRefresh}>Refresh</button>
    </div>
  </div>

  <div class="toolbar">
    <input aria-label="Search tickets" placeholder="Search id or title" />
  </div>
</header>
