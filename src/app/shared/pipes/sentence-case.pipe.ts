import { Pipe, type PipeTransform } from "@angular/core";

@Pipe({
  name: "sentenceCase"
})
export class SentenceCasePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}
