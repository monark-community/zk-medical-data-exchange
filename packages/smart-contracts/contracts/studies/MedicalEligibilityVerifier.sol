// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 20947677048627408399933474539297998569958870279985155152457381396585779410294;
    uint256 constant alphay  = 4387913589145802684008904511694914431274201938348567800254677044445757914445;
    uint256 constant betax1  = 4982894177717685876725338047354224484672826932433204819199015470141368649116;
    uint256 constant betax2  = 19711894137952499822904899975157057228093896116594077375172896250637096674919;
    uint256 constant betay1  = 3034140872160221160832169033174822978234773477036901966096037635940269522664;
    uint256 constant betay2  = 17795722943918127989796024518128768527957238785008522299879724938155533066878;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 2062829744879948383980350434183409105105976685459095654067132847310445603738;
    uint256 constant deltax2 = 486948614333792313823462738253855202867249632810672882171750185144629507023;
    uint256 constant deltay1 = 9197114110598946699524134232496001434136889297314894633067805566385416004092;
    uint256 constant deltay2 = 11792854461273382734619569746171553074423687125803669795563279064472059724212;

    
    uint256 constant IC0x = 19126675121404099792349951209315913689684504774083836014199511289306878884718;
    uint256 constant IC0y = 20795211846955467657227532774683471309748567326802550926180792372784323037180;
    
    uint256 constant IC1x = 18093047353020471961455697074679672956157912856152234650265453130623696347346;
    uint256 constant IC1y = 6682301384508086675203882673643543447138610436932867324559686729796823012403;
    
    uint256 constant IC2x = 4202027722735585391313160788886189906875190797588886014688833719777380159854;
    uint256 constant IC2y = 11151221357109129872945995275922652875917565079986346124881985506425269025266;
    
    uint256 constant IC3x = 15709202686606648369419081512369637686822382104320420465254342089670309836378;
    uint256 constant IC3y = 11318033197268739306951649057628518789046617798053225467111760017201144365084;
    
    uint256 constant IC4x = 10890504417696312186106178117196381713977988835721371496910885383608969497594;
    uint256 constant IC4y = 7799934843397707104125230720866346427113520004670355451506916837996408119048;
    
    uint256 constant IC5x = 16210884100242796176427885918915823289958599940673570313420784184635255992910;
    uint256 constant IC5y = 16912702687489316607139726034374155275762677000630129763175239062090197743270;
    
    uint256 constant IC6x = 6354976088123628573495605437960210889871022341616789712847912596132358902629;
    uint256 constant IC6y = 6043389221655537094146828936043274975932215777355612662088459945065165039190;
    
    uint256 constant IC7x = 2167213549229877968100154009856845644385139843068476309989656530413100585221;
    uint256 constant IC7y = 16885574289459091289511745485715589979466891226514752886294010710241834188758;
    
    uint256 constant IC8x = 2614898740646569248633556808432899169766413844718333903914874424842893025456;
    uint256 constant IC8y = 5096056310141252024476714485623277362368513018527897995841016433128226155984;
    
    uint256 constant IC9x = 17088352572848259263524706013828562404579753698726517407860859491822935194165;
    uint256 constant IC9y = 19419784064589205724892803816956490047074622073605804092762945516352734004094;
    
    uint256 constant IC10x = 2874318165920227530434869626901508251713703098621064853239491869679382302645;
    uint256 constant IC10y = 2193983330305310137412186972784829134583846672204927546111368131598462946234;
    
    uint256 constant IC11x = 11016184701306584993884599856507172886882746422836097897373482759556982889352;
    uint256 constant IC11y = 9596176547610253507531461527913756311660202266955532133867682778177680829038;
    
    uint256 constant IC12x = 538235878208793069271049700620200636154443064293203412791734463366613789820;
    uint256 constant IC12y = 17724852599727929344044843707395847841822237348988340195700853471643336889303;
    
    uint256 constant IC13x = 7944267113499506919474923172624625091127767798292556727674793818561785295470;
    uint256 constant IC13y = 10304613233681631293459428029539319043838432514494395323417030741254849198444;
    
    uint256 constant IC14x = 16325771504219745063250862632611636508137349182971397667889284354726288027292;
    uint256 constant IC14y = 13674640646734342363036769100586733894598957410136819947850889658738257864968;
    
    uint256 constant IC15x = 18543705885768776355945100786043328519660862687832230310983347344241633139732;
    uint256 constant IC15y = 5393963583085378553014901497620490384490677493793938438658517320154337673703;
    
    uint256 constant IC16x = 13599385809762445645651776217447846876629229884786204175034301398554358013614;
    uint256 constant IC16y = 7217368687754344730191663208762321199024418144995673679559305233104482317121;
    
    uint256 constant IC17x = 5557098187277069044016493515411718807399647227163059862949078010920251655201;
    uint256 constant IC17y = 21810756671834142100990232929647446469209319116557067656184216884796265987210;
    
    uint256 constant IC18x = 10142133202851937300619375606700092278223416272756659237745700647283879873222;
    uint256 constant IC18y = 10286062705527730961809128608790070209453609852420431068493249505061323874915;
    
    uint256 constant IC19x = 5894612045460321198504930473892785634355389180137539813676446623164866270609;
    uint256 constant IC19y = 17947904149249087146987854194419945507751707485368620246187362721435658950250;
    
    uint256 constant IC20x = 9290619404094496233009301384715208707446828647044269060930365839337318705517;
    uint256 constant IC20y = 17349755843173011856534418011620580395520608463448375511105493835658355589212;
    
    uint256 constant IC21x = 21845484293293788094585746178086054316112131781193413812353272363682953845153;
    uint256 constant IC21y = 13182878715276388025981013327827860294325830496798893458044571974219142063977;
    
    uint256 constant IC22x = 17197262028109910478930118765332019902029487552181518115360719179163815560506;
    uint256 constant IC22y = 18371658349723677098296308946600325352941232340638461637649335742194876037327;
    
    uint256 constant IC23x = 11640763816013221998635131100329549146441927153860308449055558101061366766634;
    uint256 constant IC23y = 4648788552078163098937957610866791225858113583796381817120122475680336905584;
    
    uint256 constant IC24x = 2708375299133322591090307904722514217877912659062558660040426789847090422068;
    uint256 constant IC24y = 10577184057154647963309568506264019731096715804824886919997104635475517441684;
    
    uint256 constant IC25x = 15508090372784981090515142063164371345502602370429228167603689779183458892196;
    uint256 constant IC25y = 8623908203684791482426682681591904669777309598738168162667582371389758765245;
    
    uint256 constant IC26x = 7928717233081214558744832107841230430006973137878487572538311432267933302555;
    uint256 constant IC26y = 2192731033898389159069429940455410753766206426986658889501358722060946100140;
    
    uint256 constant IC27x = 10697266284049982197474558315505640186278919114640721428340956089916625040649;
    uint256 constant IC27y = 13909671805360486937460547190761731232234811536740925467289183616680839497062;
    
    uint256 constant IC28x = 20067437115409355465897883083289680941235297734587522859583715197696663246954;
    uint256 constant IC28y = 15027107173151132257208442058964039414048210487973580105660961527872009595843;
    
    uint256 constant IC29x = 11391215824302607316502051201316163448421164019874989211850157347543114244132;
    uint256 constant IC29y = 18073888228956991010564160929776633646827361674964246516096322964001171171015;
    
    uint256 constant IC30x = 12411257521180880024858280112790537183295818762066977822368700859162602199779;
    uint256 constant IC30y = 2813618301850566236577413222848603500881443820419939382443550217793032611381;
    
    uint256 constant IC31x = 8197990256991601387203340613039730448348060570318016081114559634149150368539;
    uint256 constant IC31y = 8307190356550032699319399697900925721367655644381585428135308425068714262771;
    
    uint256 constant IC32x = 13863296296901353813844889101587595628888958390278276123130990077415501723536;
    uint256 constant IC32y = 14621929130755853796452008549855845117752126473935019583235204233551343437875;
    
    uint256 constant IC33x = 10497922979243157707332733218508230317181805559829816878666933428154624397222;
    uint256 constant IC33y = 20492991009473462382913244672560264264252445564434941235406567852452593096518;
    
    uint256 constant IC34x = 1254977201490634351324294385347179933592726890515108861301746558777263663344;
    uint256 constant IC34y = 10620682760755665343392775425453701829944809616150571254928078841769542349987;
    
    uint256 constant IC35x = 12492978786927588008344986458717431809281144469341907038944029896552511714827;
    uint256 constant IC35y = 3896022321527771836208379418983139217452069939839265908513976433826635143940;
    
    uint256 constant IC36x = 4238408555720587589579892451631275267588643623739846272190104469207697090508;
    uint256 constant IC36y = 19980664818098599910072623906677007572677127142319978601273687881384543018149;
    
    uint256 constant IC37x = 6170088188428049013886125106777213274322287288888371470622631280906307391892;
    uint256 constant IC37y = 6771751640079422513795644223482883389401487868775736403735672257806037886040;
    
    uint256 constant IC38x = 17294863873049884091563646050144596014613414007901957445818360172272176787493;
    uint256 constant IC38y = 9031802115843160337639679137337043142639164217028621245689356918199269725195;
    
    uint256 constant IC39x = 4157008877423197480354002627158392739025266695146193755538815400056398172886;
    uint256 constant IC39y = 20279141433269504007962792194097476572011447286436398349357637280844732465373;
    
    uint256 constant IC40x = 15778023147093863490786683236241616160369976351598325939570883993962679902590;
    uint256 constant IC40y = 4907224537899725743129471382132521410403231455670293530890596645238946442097;
    
    uint256 constant IC41x = 15784388311383684544216060847882931382073498162506294699372499668530688305430;
    uint256 constant IC41y = 14873150647802404642544101849481999229430093023083558213219679342957005507976;
    
    uint256 constant IC42x = 20164200797947321341865157900319558979531186599332439375111466047533951471095;
    uint256 constant IC42y = 13818031175509610503103891220049808488559161292696584312790961032733757860417;
    
    uint256 constant IC43x = 11336596487243016348373368234315548286513943457147508045487777161861328697680;
    uint256 constant IC43y = 21216071692321854749075564527588492324884699525033329883776004874403852777343;
    
    uint256 constant IC44x = 13223008321970371976479409526004452047094828909659827273431485435065079855941;
    uint256 constant IC44y = 19826985855999083272681742350208806935264494321480621690718813353180186766913;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[44] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                
                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))
                
                g1_mulAccC(_pVk, IC24x, IC24y, calldataload(add(pubSignals, 736)))
                
                g1_mulAccC(_pVk, IC25x, IC25y, calldataload(add(pubSignals, 768)))
                
                g1_mulAccC(_pVk, IC26x, IC26y, calldataload(add(pubSignals, 800)))
                
                g1_mulAccC(_pVk, IC27x, IC27y, calldataload(add(pubSignals, 832)))
                
                g1_mulAccC(_pVk, IC28x, IC28y, calldataload(add(pubSignals, 864)))
                
                g1_mulAccC(_pVk, IC29x, IC29y, calldataload(add(pubSignals, 896)))
                
                g1_mulAccC(_pVk, IC30x, IC30y, calldataload(add(pubSignals, 928)))
                
                g1_mulAccC(_pVk, IC31x, IC31y, calldataload(add(pubSignals, 960)))
                
                g1_mulAccC(_pVk, IC32x, IC32y, calldataload(add(pubSignals, 992)))
                
                g1_mulAccC(_pVk, IC33x, IC33y, calldataload(add(pubSignals, 1024)))
                
                g1_mulAccC(_pVk, IC34x, IC34y, calldataload(add(pubSignals, 1056)))
                
                g1_mulAccC(_pVk, IC35x, IC35y, calldataload(add(pubSignals, 1088)))
                
                g1_mulAccC(_pVk, IC36x, IC36y, calldataload(add(pubSignals, 1120)))
                
                g1_mulAccC(_pVk, IC37x, IC37y, calldataload(add(pubSignals, 1152)))
                
                g1_mulAccC(_pVk, IC38x, IC38y, calldataload(add(pubSignals, 1184)))
                
                g1_mulAccC(_pVk, IC39x, IC39y, calldataload(add(pubSignals, 1216)))
                
                g1_mulAccC(_pVk, IC40x, IC40y, calldataload(add(pubSignals, 1248)))
                
                g1_mulAccC(_pVk, IC41x, IC41y, calldataload(add(pubSignals, 1280)))
                
                g1_mulAccC(_pVk, IC42x, IC42y, calldataload(add(pubSignals, 1312)))
                
                g1_mulAccC(_pVk, IC43x, IC43y, calldataload(add(pubSignals, 1344)))
                
                g1_mulAccC(_pVk, IC44x, IC44y, calldataload(add(pubSignals, 1376)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            
            checkField(calldataload(add(_pubSignals, 736)))
            
            checkField(calldataload(add(_pubSignals, 768)))
            
            checkField(calldataload(add(_pubSignals, 800)))
            
            checkField(calldataload(add(_pubSignals, 832)))
            
            checkField(calldataload(add(_pubSignals, 864)))
            
            checkField(calldataload(add(_pubSignals, 896)))
            
            checkField(calldataload(add(_pubSignals, 928)))
            
            checkField(calldataload(add(_pubSignals, 960)))
            
            checkField(calldataload(add(_pubSignals, 992)))
            
            checkField(calldataload(add(_pubSignals, 1024)))
            
            checkField(calldataload(add(_pubSignals, 1056)))
            
            checkField(calldataload(add(_pubSignals, 1088)))
            
            checkField(calldataload(add(_pubSignals, 1120)))
            
            checkField(calldataload(add(_pubSignals, 1152)))
            
            checkField(calldataload(add(_pubSignals, 1184)))
            
            checkField(calldataload(add(_pubSignals, 1216)))
            
            checkField(calldataload(add(_pubSignals, 1248)))
            
            checkField(calldataload(add(_pubSignals, 1280)))
            
            checkField(calldataload(add(_pubSignals, 1312)))
            
            checkField(calldataload(add(_pubSignals, 1344)))
            
            checkField(calldataload(add(_pubSignals, 1376)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
