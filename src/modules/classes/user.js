export class Visit {
    constructor(visit) {
        this.usage_id = visit?.usage_id;
        this.sessionID = visit?.session_id;
        this.startTime = visit?.start_time;
        this.closeTime = visit?.close_time;
        this.visitEnded = visit?.visit_ended;
        this.sessionOpen = visit?.session_open;
        this.status = visit?.status;
        this.reason = visit?.reason;
        this.page = visit?.page;
        this.pageKey = visit?.page_key;
        this.parentPageKey = visit?.parent_page_key;
        this.timeAway = visit?.time_away;
        this.duration = visit?.duration;
    }
}

export default class User {

    constructor({name, email, image, _visits = [], useCount = 0, id=null}) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.image = image;
        this._visits = _visits;
        this.useCount = useCount;
    }

    addVisit(visit) {
        this._visits.push(new Visit(visit));
        this.useCount += 1;
    }

    get visits() {
        return this._visits.map((visit) => new Visit(visit));
    }

    updateVisit(index, visit) {
        this._visits[index] = visit;
    }

    lastOpenVisitFromSession(sessionID) {
        let visit = this.visits
            .filter(session => session.sessionID === sessionID)
            .reduce((acc, visit) => {
                if (!acc) return visit;
                if (new Date(visit?.startTime) > new Date(acc.startTime)) return visit;
                return acc;
            }, null)
        if (!visit) return [null, null];
        let index = this._visits.findIndex((v) => v.startTime === visit.startTime);
        return [visit, index];
    }

    get lastVisit() {
        return new Visit(this._visits.reduce((acc, visit) => {
            if (!acc) return visit;
            if (new Date(visit.startTime) > new Date(acc.startTime)) return visit;
            return acc;
        }, null));
    }

    get daysSinceLastVisit() {
        if (!this.lastVisit) return null;
        return Math.floor((new Date() - new Date(this.lastVisit.startTime)) / (1000 * 60 * 60 * 24));
    }

    get durationOnPage() {
        return this.visits.reduce((acc, visit) => {
            if (!acc[visit.parentPageKey]) {
                acc[visit.parentPageKey] = {};
            }
            if (!acc[visit.parentPageKey][visit.pageKey]) {
                acc[visit.parentPageKey][visit.pageKey] = 0;
            }
            acc[visit.parentPageKey][visit.pageKey] += visit.duration;
            // caps all page visits at an hour and a half
            if (acc[visit.parentPageKey][visit.pageKey] > 5400000) {
                acc[visit.parentPageKey][visit.pageKey] = 5400000;
            }
            return acc;
        }, {})
    }

    get pageUsage() {
        return this.visits.reduce((acc, visit) => {
            if (!acc[visit.parentPageKey]) {
                acc[visit.parentPageKey] = {};
            }
            if (!acc[visit.parentPageKey][visit.pageKey]) {
                acc[visit.parentPageKey][visit.pageKey] = 0;
            }
            acc[visit.parentPageKey][visit.pageKey]++;
            return acc;
        }, {})
    }
}