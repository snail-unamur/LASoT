export enum ObservationType {
    methods,
    tests
}

export class Observation {
    private type: ObservationType;
    public signaledMethods: SignaledMethod[] = [];

    constructor(observationType: ObservationType){
        this.type = observationType;
    }
}

export class SignaledMethod {
    public diffs: Diff[] = [];
    public hints: Hint[] = [];
    public mutation: Mutation = new Mutation();
}

export class Mutation {
    mutator: string = '';
    class: string = '';
    package: string = '';
    method: string = '';
    description: string = '';
    tests: string[] = [];
}

export class Hint {
	pointcut: string = '';
	hintType: string = '';
	location: Location = new Location();
}

export class Location {
	point: string = '';
	type: string = '';
	from: ReneriPosition = new ReneriPosition();
	to: ReneriPosition = new ReneriPosition();
	file: string = '';
}

export class ReneriPosition {
    line: number = 0;
    column: number = 0;
}

export class Diff {
    pointcut: string = '';
    expected: ReturnedValue[] = [];
    unexpected: ReturnedValue[] = [];
} 

export class ReturnedValue {
    literalValue: string = '';
    typeName: string = '';
}

