export const cpNormalize = (v: string) => v.toLocaleLowerCase('id').replace(/[^a-z0-9]/g, '');
const aliases: Record<string,string[]> = {
 matematika:['mtk','matematikasd','matematikakelas'], bahasaindonesia:['bin','bindo'], pendidikanpancasila:['pp','pkn','ppkn'], ilmupengetahuanalamdansosialipas:['ipas','ilmupengetahuanalamdansosial'], pendidikanjasmaniolahragadankesehatanpjok:['pjok','penjas','pendidikanjasmaniolahragadankesehatan'], bahasainggris:['big','bing'], senirupa:['sr'], senimusik:['sm'], senitari:['st'], seniteater:['ste'], kodingdankecerdasanartifisial:['kka','koding'], pendidikanagamaislamdanbudipekerti:['pai','pendidikanagamaislam'], pendidikanagamakristendanbudipekerti:['pak','pendidikanagamakristen'], pendidikanagamakatolikdanbudipekerti:['pakt','pendidikanagamakatolik'], pendidikanagamahindudanbudipekerti:['pah','pendidikanagamahindu'], pendidikanagamabuddhadanbudipekerti:['pab','pendidikanagamabuddha'], pendidikanagamakhonghucudanbudipekerti:['pakh','pendidikanagamakhonghucu']
};
export function cpSubjectMatches(name:string, code:string, catalogName:string):boolean {
 const n=cpNormalize(name||''), c=cpNormalize(code||''), k=cpNormalize(catalogName);
 if(n===k) return true;
 const specific = Object.entries(aliases).find(([key,values])=>key===c||values.includes(c));
 if(specific && ['seni','senibudaya','pendidikanagamadanbudipekerti','pendidikanagama','agama'].includes(n)) return specific[0]===k;
 // Generic school labels allow an explicit branch selection, never silently select a branch.
 if(['seni','senibudaya'].includes(n)) return ['senirupa','senimusik','senitari','seniteater'].includes(k);
 if(['pendidikanagamadanbudipekerti','pendidikanagama','agama'].includes(n)) return k.startsWith('pendidikanagama');
 return (aliases[k]||[]).some(a=>n===a||c===a|| (k==='matematika' && n.startsWith(a)&&a.length>3));
}
