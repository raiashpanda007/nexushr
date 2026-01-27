const AnalysisViewTemplate = document.createElement("template");
AnalysisViewTemplate.innerHTML = `
    <div class="w-full">
       <h2 class="text-2xl font-bold text-slate-800 mb-6">Analysis Center</h2>
       <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <p class="text-slate-600">Analysis dashboard coming soon...</p>
       </div>
    </div>
`;

class AnalysisView extends HTMLElement {
    constructor() {
        super();
        this.appendChild(AnalysisViewTemplate.content.cloneNode(true));
    }
}

customElements.define("app-analysis-view", AnalysisView);
