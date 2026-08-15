let visitRecords = [];

function renderRecordsList() {
  const container = document.getElementById("records-container");
  const counter = document.getElementById("tab-count");

  if (counter) counter.innerText = visitRecords.length;
  if (visitRecords.length === 0 || !container) return;

  container.innerHTML = visitRecords
    .map(
      (rec) => `
    <div class="bg-slate-800 border border-slate-700 p-4 rounded-xl flex justify-between items-center shadow-sm">
        <div class="flex-1">
            <div class="flex items-center space-x-2">
                <span class="font-bold text-white text-base">${rec.person}</span>
                <span class="text-xs px-2 py-0.5 rounded text-white font-semibold ${
                  rec.status === "Preached"
                    ? "bg-emerald-600"
                    : rec.status === "Return Visit"
                      ? "bg-blue-600"
                      : rec.status === "Bible Study"
                        ? "bg-yellow-600"
                        : "bg-red-600"
                }">${rec.status}</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">Publisher: ${rec.publisher}</p>
            <p class="text-[10px] text-slate-500 mt-0.5">📅 ${rec.date}</p>
        </div>
        <div class="flex items-center space-x-2 flex-shrink-0">
          ${
            rec.phone
              ? `<a href="tel:${rec.phone}" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg flex items-center justify-center font-bold text-xs active:scale-95 transition">📞</a>`
              : ""
          }
          <button onclick="deletePin(${rec.id})" 
                  class="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg flex items-center justify-center font-bold text-xs active:scale-95 transition">
              🗑️
          </button>
        </div>
    </div>
`
    )
    .join("");
}
