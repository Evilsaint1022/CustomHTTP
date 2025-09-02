const searchInput=document.getElementById('searchInput');
const tableBody=document.getElementById('fileTableBody');

(function() {

    const original = [...tableBody.querySelectorAll('.file-row')];

    searchInput.addEventListener('input', () => {

        const q = searchInput.value.toLowerCase();

        if (!q.trim()) {

            original.forEach(r => {

                r.classList.remove('hide');
                r.classList.add('show');
                tableBody.appendChild(r);
                
            });

            return;
        }

        const matches = [];
        const rest = [];

        original.forEach(r => {

            const name = r.querySelector('.file-link').textContent.toLowerCase();
            if (name.includes(q)) {
                r.classList.remove('hide');
                r.classList.add('show');
                matches.push(r);
            } else {
                r.classList.add('hide');
                r.classList.remove('show');
                rest.push(r);
            }
        });

        matches.forEach(r => tableBody.appendChild(r));
        rest.forEach(r => tableBody.appendChild(r));

    });

})();

let lastHover=null;

tableBody.addEventListener('mouseover', e => {

    const tr = e.target.closest('tr.file-row');

    if (!tr || tr === lastHover) return;
    if (lastHover) lastHover.classList.remove('row-hover');

    tr.classList.add('row-hover');
    lastHover = tr;
    
});

tableBody.addEventListener('mouseleave', e => {

    if (!tableBody.contains(e.relatedTarget) && lastHover) {
        lastHover.classList.remove('row-hover');
        lastHover = null;
    }

});
