export default class Query {
    constructor(table,columns) {
        this.table = table;
        this.columns = columns;
        this.offset = null;
        this.aggregateColumns = [];
        this.having = [];
        this.joins = [];
        this.where = [];
        this.nullCols = [];
        this.notNull = [];
        this.whereChains = [];
        this.adHocWhere = null;
        this.groupBy = [];
        this.orderBy = [];
        this.limit = [];
        this.params = [];
        this._query = "";
    }
    addAggregate(column,aggregate){
        this.aggregateColumns.push([aggregate,column]);
        return this;
    }
    addColumn(column){
        this.columns.push(column);
        return this;
    }
    addWhere(column,operator,value){
        this.where.push({column,operator,value});
        return this;
    }
    isNull(column){
        this.nullCols.push({column, operator: 'IS NULL'});
        return this
    }
    isNotNull(column){
        this.nullCols.push({column, operator: 'IS NOT NULL'});
        return this;
    }
    addHaving(column,operator,value){
        this.having.push({column,operator,value});
        return this;
    }
    addWhereWithOr(conditions){
        this.whereChains.push(conditions);
        return this;
    }
    addAdHocWhere(condition){
        this.adHocWhere = condition
        return this;
    }
    join(table,joinType,joinCondition){
        this.joins.push([table,joinType,joinCondition]);
        return this;
    }
    conditional = (condition,cbIfTrue,cbIfFalse) => {
        if(condition){
            cbIfTrue(this);
        }else{
            cbIfFalse(this);
        }
        return this;
    }
    addGroupBy(column){
        this.groupBy.push(column);
        return this;
    }
    addOffset(offset){
        this.offset = offset;
        return this;
    }
    addOrderBy(column,direction){
        this.orderBy.push({column,direction});
        return this;
    }
    addLimit(limit){
        this.limit.push(limit);
        return this;
    }
    build(){
        if(this._query) return this._query;
        let count = 1;

        let query = `SELECT ${this.columns.join(", ")} `;

        if(this.aggregateColumns.length > 0){
            query += `, ${this.aggregateColumns.map(([,column])=>`${column.replace("'@'",`$${count++}`)}`).join(", ")}`;
            this.params.push(...this.aggregateColumns.map(([aggregate])=>aggregate));
        }
        query += ` FROM ${this.table} `;
        if(this.joins.length > 0){
            query += ` ${this.joins.map(([table,joinType,joinCondition])=>`${joinType} JOIN ${table} ON ${joinCondition}`).join(" ")}`;
        }

        if(this.where.length > 0){
            query += ` WHERE ${this.where.map(({column,operator})=>`${column} ${operator} $${count++}`).join(" AND ")}`;
            this.params.push(...this.where.map(({value})=>value));
        }
        if(this.whereChains.length > 0) {
            if (this.params.length > 0) {
                query += ` AND ${this.whereChains
                    .map((conditions) => `(${conditions.map(({column, operator}) => `${column} ${operator} $${count++}`).join(" OR ")})`)
                    .join(" AND ")}`;
                this.params = [
                    ...this.params,
                    ...this.whereChains
                        .map((conditions) => conditions.map(({value}) => value))
                        .flat()
                ];
            }
            else {
                query += ` WHERE ${this.whereChains
                    .map((conditions) => `(${conditions.map(({column, operator}) => `${column} ${operator} $${count++}`).join(" OR ")})`)
                    .join(" AND ")}`;
                this.params = [
                    ...this.whereChains
                        .map((conditions) => conditions.map(({value}) => value))
                        .flat()
                ];
            }
        }

        if(this.nullCols.length > 0){
            let start = query.includes("WHERE") ? " AND " : " WHERE ";
            query += `${start} ${this.nullCols.map(({column, operator})=>`${column} ${operator}`).join(" AND ")}`;
            console.log(query)
        }

        if(this.adHocWhere && this.where.length === 0){
            query += ` ${this.adHocWhere}`;
        }
        if(this.groupBy.length > 0){
            query += ` GROUP BY ${this.groupBy.join(", ")}`;
        }
        if(this.having.length > 0){
            query += ` HAVING ${this.having.map(({column,operator})=>`${column} ${operator} $${count++}`).join(" AND ")}`;
            this.params.push(...this.having.map(({value})=>value));
        }
        if(this.orderBy.length > 0){
            query += ` ORDER BY ${this.orderBy.map(({column,direction})=>`${column} ${direction}`).join(", ")}`;
        }
        if(this.limit.length > 0){
            query += ` LIMIT ${this.limit.join(", ")}`;
        }
        if(this.offset){
            query += ` OFFSET ${Number(this.offset)}`;
        }
        query += `;`;
        this._query = query;
        return query;
    }
    get query(){
        return this.build();
    }
    log(value){
        console.log(value);
        return this;
    }
    getParsedQuery(){
        let query = this.build();
        this.params.forEach((param,index)=>{
            query = query
                .replace(`$${index+1}`,` ${isNaN(param) ? `'${param}'` : Number(param)} \n \t`)
        })
        let keywords = ['SELECT','FROM','WHERE','GROUP BY','HAVING','ORDER BY','LIMIT','OFFSET','LEFT JOIN','RIGHT JOIN','INNER JOIN'];
        query = query.replaceAll(',',`, \n \t`);
        keywords.forEach((keyword)=>{
            query = query.replaceAll(keyword,` \n ${keyword} \n \t `)
        })
        return query;
    }
    run(db,logger){
        if(logger) logger(this.getParsedQuery());
        return db.query(this.query,this.params)
    }
}