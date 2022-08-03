export class DescartesReports {
    public methodReport: DescartesMethodReport = new DescartesMethodReport();
    public mutationReport: DescartesMutationReport = new DescartesMutationReport();
}

export class DescartesMutationReport {
    public mutations: DescartesMutationDetail[] = [];
    public mutators: string[] = [];
}

export class DescartesMutationDetail {
    public detected: boolean = false;
    public status: string = '';
    public mutator: string = '';
    public line: number = 0;
    public block: number = 0;
    public file: string = '';
    public index: number = 0;
    public method: Method = new Method();
    public tests: Tests = new Tests();
}

export class Method {
    public name: string = '';
    public description: string = '';
    public class: string= '';
    public package: string = '';
}

export class Tests {
    public run: number = 1;
    public ordered: string[] = [];
    public killing: string[] = [];
    public succeeding: string[] = [];
}

export class DescartesMethodReport {
    public methods: DescartesMethod[] = [];
    public analysis: DescartesAnalysis = new DescartesAnalysis();
}

export class DescartesMethod {
    public name: string = '';
    public description: string = '';
    public class: string = '';
    public package: string = '';
    public ['file-name']: string = '';
    public ['line-number']: number = 0;
    public classification: string = '';
    public detected: string[] = [];
    public ['not-detected']: string[] = [];
    public tests: string[] = [];
    public mutations: DescartesMutation[] = [];
}

export class DescartesAnalysis {
    public time: number = 0;
    public mutators: string[] = [];
}

export class DescartesMutation {
    public status: string = '';
    public mutator: string = '';
    public ['tests-run']: number = 0;
    public tests: string[] = [];
    public ['killing-tests']: string[] = [];
    public ['succeeding_tests']: string[] = [];
}