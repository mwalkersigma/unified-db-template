export default class OrgNode {
    constructor(id, name, title, parent, email) {
        this.id = id;
        this.name = name;
        this.title = title;
        this.parent = parent;
        this.email = email;
        this.children = {};
    }
}