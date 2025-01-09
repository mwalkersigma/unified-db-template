import OrgNode from './orgNode.js';

class OrgChart{
    constructor() {
        this.orgGraph = {};
    }
    insertNode(node) {
        if (!node.name) return;
        if (!this.orgGraph[node.name]) {
            this.orgGraph[node.name] = node;
        }
    }
    has(name,graph = this.orgGraph) {
        let found = graph[name];
        if(found) return found;
        for(let key in graph){
            if(graph[key].children) {
                let result = this.has(name, graph[key].children);
                if(result) return result;
            }
        }
        return null;
    }
    getDescendants(name, graph = this.orgGraph) {
        let descendants = [];
        let node = this.has(name, graph);
        if(node) {
            let children = Object.values(node.children)
            descendants.push(...children)
            children.forEach((child)=>{
                descendants.push(...this.getDescendants(
                    child.name,
                    node.children
                ))
            })
        }
        return descendants;
    }
}

export default function createOrgChart(users) {
    if(!users) return null;
    const nodes = users.map(user => {
        return new OrgNode(
            user.ID,
            user.FirstName + ' ' + user.LastName,
            user.Title,
            user.Manager,
            user.Email
        )
    })

    const orgChart = new OrgChart();
    let maxRuns = 1000;
    let runs = 0;

    while (nodes.length > 0 && runs < maxRuns) {
        for(let i = 0; i < nodes.length; i++) {
            let node = nodes.shift();
            if(!node.parent) {
                orgChart.insertNode(node);
                continue;
            }
            let parent = orgChart.has(node.parent);
            if(parent) {
                parent.children[node.name] = node;
                continue;
            }
            nodes.push(node);
        }
        runs++;
         if(runs === maxRuns) console.log("Orphans: ", nodes);
         if(runs === maxRuns) console.log('Infinite loop detected');
    }
  return orgChart;
}

