export namespace main {
	
	export class Pattern {
	    name: string;
	    path: string;
	    type: string;
	    modTime: number;
	
	    static createFrom(source: any = {}) {
	        return new Pattern(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.type = source["type"];
	        this.modTime = source["modTime"];
	    }
	}

}

