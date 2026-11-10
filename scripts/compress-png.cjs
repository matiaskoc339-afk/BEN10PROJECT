// Repack PNG's deflate stream without changing a single decoded scanline.
const zlib=require('node:zlib');
const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
function crc32(data){let c=0xffffffff;for(const byte of data)c=crcTable[(c^byte)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function compressPng(png){
 const chunks=[],streams=[];for(let p=8;p<png.length;){const size=png.readUInt32BE(p),type=png.toString('ascii',p+4,p+8),chunk=png.subarray(p,p+size+12);chunks.push({type,chunk});if(type==='IDAT')streams.push(png.subarray(p+8,p+size+8));p+=size+12;}
 const old=Buffer.concat(streams),packed=zlib.deflateSync(zlib.inflateSync(old),{level:9});if(packed.length>=old.length)return png;
 const idat=Buffer.alloc(packed.length+12);idat.writeUInt32BE(packed.length,0);idat.write('IDAT',4,'ascii');packed.copy(idat,8);idat.writeUInt32BE(crc32(idat.subarray(4,packed.length+8)),packed.length+8);
 const output=[png.subarray(0,8)];let written=false;for(const {type,chunk} of chunks){if(type!=='IDAT')output.push(chunk);else if(!written){output.push(idat);written=true;}}return Buffer.concat(output);
}
module.exports={compressPng};
