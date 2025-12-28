document.getElementById("btn").onclick = () => {
    const params = new URLSearchParams(location.search);
    const target = params.get("target");
    if (target) location.href = target;
};
