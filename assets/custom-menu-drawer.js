/*
  Mobile menu drawer: keep the top-level groups (SHOP …) expanded every time
  the drawer opens.

  Dawn's closeMenuDrawer() strips `open` from every <details> inside the
  drawer, so a group that starts expanded in the markup stays collapsed from
  the second opening onwards — whatever closed it (the X, tapping outside,
  focus leaving, Escape). The drawer's own toggle event is the one signal all
  of those share, so the groups are re-opened there.
*/
(() => {
  const container = document.getElementById('Details-menu-drawer-container');
  if (!container) return;
  container.addEventListener('toggle', () => {
    if (!container.open) return;
    container.querySelectorAll('#menu-drawer details.drawer-accordion').forEach((group) => {
      group.open = true;
    });
  });
})();
