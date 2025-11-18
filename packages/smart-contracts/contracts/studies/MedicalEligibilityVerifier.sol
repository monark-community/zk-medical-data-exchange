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
    uint256 constant alphax  = 20078726824317646598483266599743165152956203519872060466179935733996499950978;
    uint256 constant alphay  = 8266894098506530103050742781909974180835898545516090274712026173394459188975;
    uint256 constant betax1  = 20788570755445896062200894260753767150666826780109843326853602528504517440682;
    uint256 constant betax2  = 18169104778873523426942119331380287814775063011446491164539199029087928414988;
    uint256 constant betay1  = 9045244030035411788506563301574778970620498934902221559007415256742167664969;
    uint256 constant betay2  = 2191742054223711317268580973671685686703425359576735413658003429472201762022;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 12840934125736680460632930463961970222803084865882194171294822589187924106804;
    uint256 constant deltax2 = 13897058649976082136188617481112904198568068909170614952027851358109217621786;
    uint256 constant deltay1 = 18499115236944696782537919396202892321386023550396017700317241816096792052364;
    uint256 constant deltay2 = 5902410790780855752062084440980256876245674387054637064735346619745103172614;

    
    uint256 constant IC0x = 16263080725723343698897558052092598003642114194293782272904484468759644330873;
    uint256 constant IC0y = 14018023672444620718785090703715087985493419068606294903600350596592037924501;
    
    uint256 constant IC1x = 12199823207129457242956685868117833177219190679207091320318930947188405873856;
    uint256 constant IC1y = 1923506914252679188046188347191982277197028661961795288437600615487927488407;
    
    uint256 constant IC2x = 6353871244668394176938768186054649001716784358685453412202984587040682717467;
    uint256 constant IC2y = 14012499814370133420824668155650914426014131007123550528539388024439622066796;
    
    uint256 constant IC3x = 12878582069923735227990450159502846226819895513892979603016870151704828728515;
    uint256 constant IC3y = 3352708351574783694707967546761679544824016158575000747581448170465675243511;
    
    uint256 constant IC4x = 19975905959197158257584799349023846735769675565549413813688118359382090345675;
    uint256 constant IC4y = 9716381375482160843890825584271872597755777287644645132347307114259909124103;
    
    uint256 constant IC5x = 3484651963378719532013788815348254176997724110537511741813494845066895216428;
    uint256 constant IC5y = 3236077802039985908235911559457487937669743906160931812947589618769529445718;
    
    uint256 constant IC6x = 7026864822960934771301632605017246618803750016792871878173442734895579095057;
    uint256 constant IC6y = 17769897262642912656431335494503827325209979505665069538355665236976036047347;
    
    uint256 constant IC7x = 14530800024493926981857897584136329128993076651974119454035200284981628119154;
    uint256 constant IC7y = 20557473385270458590261504035593117485781528670462359425017115120724390099782;
    
    uint256 constant IC8x = 19559972626435895969620603934194791706374758227575561422844396249492321143912;
    uint256 constant IC8y = 2836322985540908370436474406294480262967885219564745948329957543568444994821;
    
    uint256 constant IC9x = 14701715372818555105269312254431384597303424233558358818167231822018374382341;
    uint256 constant IC9y = 13681967832872677004027713300784073933514275302000166820885679101577467425744;
    
    uint256 constant IC10x = 307455732823843648250095007560706636719367864981405094369315822361285368452;
    uint256 constant IC10y = 14493335642047189706182221303394368933923804601407029077995751449559451581632;
    
    uint256 constant IC11x = 11173067305560613246510180613261802929287175658336335476641660314733434164755;
    uint256 constant IC11y = 20311782503608938894839536938944002294236535535555598352862389758383809755946;
    
    uint256 constant IC12x = 660772253098444383630229273404413358078710543130845441845281274876743902809;
    uint256 constant IC12y = 18956149976022210573047622577869096026485083838863555010813785731856582706762;
    
    uint256 constant IC13x = 11124300492918505933249212641674715628061762148604875983885232473391703320844;
    uint256 constant IC13y = 13739424852347390441667606386810047238931735828802262951133641057247379762939;
    
    uint256 constant IC14x = 7047712686741409567238787966726001052605192739649561937872025634971635092237;
    uint256 constant IC14y = 3882210400691180975405663302231304446583712162629083155772316544893903875157;
    
    uint256 constant IC15x = 21132865578884723966544480542074689663393086417695128697201716431856563021683;
    uint256 constant IC15y = 9207969183669600219901511910890166703823615255471482625647309956901656067089;
    
    uint256 constant IC16x = 12566109048255002849149156824087889902247891261528034580313903673810680291531;
    uint256 constant IC16y = 14969768081691051960805606651891232683090625418976437078779636528714274802212;
    
    uint256 constant IC17x = 18627483386085118367189588396754065745984356613232618251434313260375336730187;
    uint256 constant IC17y = 5129739748567913921556810501745838014908992775145758521823557364678090781635;
    
    uint256 constant IC18x = 9886566613415888404917234598083432167464402805128650261137908303869981178045;
    uint256 constant IC18y = 2050014525364790490658366947631667419458928222399414158502600686283299198108;
    
    uint256 constant IC19x = 9122504351270553353745727558403673297734144335362413773584460927079685860165;
    uint256 constant IC19y = 16722699547575315959379887927296771817662295244823673422010361535675298433678;
    
    uint256 constant IC20x = 14949483614005432659979283427533982115859886789663492036037839571876182063891;
    uint256 constant IC20y = 5291740807352311058104685060638209132939266274961606198598375650768218907671;
    
    uint256 constant IC21x = 14269683972292193830974121887387463006977945460009544047288131752613195346343;
    uint256 constant IC21y = 19471371071246623788908111925792378630154511816769386580704022500420308889037;
    
    uint256 constant IC22x = 20273227617681087745539632409976378537344286238999703814929849960017868070745;
    uint256 constant IC22y = 4749248566757732004855081597778145545614383224731968398856957882106672757100;
    
    uint256 constant IC23x = 12990378654246210863253801001887104873691910667177309375317909740549141049841;
    uint256 constant IC23y = 18050146689736734677644758960568514346322666623229914841858076512071262876864;
    
    uint256 constant IC24x = 2835495130422468740692726935976830399420372935193256319659138935847117331399;
    uint256 constant IC24y = 3982998016862263708518353828423805863656431533217993298959367349596249434397;
    
    uint256 constant IC25x = 17627577896674348393415884977448614284205334900331858348327350127134260424602;
    uint256 constant IC25y = 15163088915517216661959493552172927204250866145898942049661930420038680145599;
    
    uint256 constant IC26x = 17080526937201640738489626867075808668017548198213657717024962227523704819224;
    uint256 constant IC26y = 19962355071306225943741793913512482385107499528418132385778779778814651517735;
    
    uint256 constant IC27x = 8897459950630853575977933729881477124144671638824155412310801121638673714619;
    uint256 constant IC27y = 5941553690303718424272609624549017320112942891755819284120325528611753653313;
    
    uint256 constant IC28x = 15495909510012472474935175301804404631758049050624531116154930172396655193022;
    uint256 constant IC28y = 20039031085998375062315240949662540455946698105950351296939538288637844054481;
    
    uint256 constant IC29x = 3697768576630816940147420165574397171457993128241232823278854769507577538537;
    uint256 constant IC29y = 6250266598293168383183346480272670019068939963758067031288610982472256491591;
    
    uint256 constant IC30x = 6749879803156077115848710091895216286509375356581492266643123723931044301020;
    uint256 constant IC30y = 9689377390257470011933248605886597070083715450961765456062021986282393734368;
    
    uint256 constant IC31x = 20757825082205492238206645681174692692993082173733425608828605702554788377409;
    uint256 constant IC31y = 7339571396660376873728359726626400324450762136021033646186617756335808422985;
    
    uint256 constant IC32x = 4527724383544226237145301035727370482535418927574514133664855577205537375465;
    uint256 constant IC32y = 16926460076127382624153922017988116085486927036001716182825033410400671115105;
    
    uint256 constant IC33x = 3215132124203649930587837539394316763169673716195075366933038385811752480669;
    uint256 constant IC33y = 19302687068987535388685301814655056516804978213789969714769312953953363851288;
    
    uint256 constant IC34x = 1369428646993574065552477762767167539532105982280890435631175209427637044290;
    uint256 constant IC34y = 19672786091569701405768325123205684091789072381157008347837625541721072848376;
    
    uint256 constant IC35x = 13427610414219850372422893305765033039371458482889976897270968831535335106670;
    uint256 constant IC35y = 11580119262826714161042898747561183112752403449333906561183611902074252797359;
    
    uint256 constant IC36x = 10071061342735628134395573946713820395574275724178910577790535334968034052118;
    uint256 constant IC36y = 17774996883750685743878774538959861596342291360433854047381071364940358183076;
    
    uint256 constant IC37x = 4190799131681114055529364815995166560573733212940380866795032335311617666325;
    uint256 constant IC37y = 14416736386401979293288516347463946912714094102969216012784570737473929453186;
    
    uint256 constant IC38x = 1873844250774088426471801220277768050727544556858034246092286781710869048747;
    uint256 constant IC38y = 5067343296183750122771538408699372306237511105570242816468570876657858765130;
    
    uint256 constant IC39x = 3832121985009411652369449829743474968604283615000710766112642449308834728299;
    uint256 constant IC39y = 14713473750410422850443707635365740589924471227101501628423941824384088650581;
    
    uint256 constant IC40x = 11221282159254454620037902475477149969347690243718179094094984160113335157406;
    uint256 constant IC40y = 3776251715606298506895037469870645283731885166059539753630552891606726730495;
    
    uint256 constant IC41x = 12157828359041496179634463740554107462007606629718568227911081540279975818679;
    uint256 constant IC41y = 1125318632309409194893673754465091025656818144327824304551239732042523940868;
    
    uint256 constant IC42x = 16941239058653159130083782688217359436539402406907137493874800492706107003801;
    uint256 constant IC42y = 10623851490142284072214844992705759197590299932438447636693823128411321803544;
    
    uint256 constant IC43x = 12707723241374216967329163106760060379177842174760899190531390906561141991305;
    uint256 constant IC43y = 9817664908153197968112919713359755922484031306616048450206822611223723234065;
    
    uint256 constant IC44x = 11321746810149582779382231543172080209991666732007938213977008652950173282047;
    uint256 constant IC44y = 10390418647303332601591704058568399099217994756585104649157032325959059111066;
    
    uint256 constant IC45x = 10749463598160627845403327404659442563722700751797048317826636416192299935391;
    uint256 constant IC45y = 9116114674653287526348866896704958369296499014309810929612975317497238298041;
    
    uint256 constant IC46x = 15476091422843429630010794063550247167002159088227648689822971788247256738221;
    uint256 constant IC46y = 10896582821477649763967707773950772938039554723141285289407567635355451026644;
    
    uint256 constant IC47x = 13734988378428846115048177101904511195718666416721856543374037408522148823020;
    uint256 constant IC47y = 18507990780954532966627008541910486603730702411900826134977016163469891049696;
    
    uint256 constant IC48x = 19540375949374865998178245883714886609044773770701268309093498682328328058776;
    uint256 constant IC48y = 15482323816433826576607851453664427353924132690180754509308078283576223092415;
    
    uint256 constant IC49x = 4020196867159643866308031100658819745796328808586297608341400461635411659882;
    uint256 constant IC49y = 19039046741523072864506946016152695453057882978389477638387975343851380534251;
    
    uint256 constant IC50x = 21109796687843471475511665985811853586255939896047938091649443852093994578955;
    uint256 constant IC50y = 1002510638021911583603017968685477154995732447046964234226855441609848614789;
    
    uint256 constant IC51x = 522854272016327387874597787615958573162493848098892208719058937710317869438;
    uint256 constant IC51y = 8981034663781896865501550317305034391115861654699520672262678636816346214427;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[51] calldata _pubSignals) public view returns (bool) {
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
                
                g1_mulAccC(_pVk, IC45x, IC45y, calldataload(add(pubSignals, 1408)))
                
                g1_mulAccC(_pVk, IC46x, IC46y, calldataload(add(pubSignals, 1440)))
                
                g1_mulAccC(_pVk, IC47x, IC47y, calldataload(add(pubSignals, 1472)))
                
                g1_mulAccC(_pVk, IC48x, IC48y, calldataload(add(pubSignals, 1504)))
                
                g1_mulAccC(_pVk, IC49x, IC49y, calldataload(add(pubSignals, 1536)))
                
                g1_mulAccC(_pVk, IC50x, IC50y, calldataload(add(pubSignals, 1568)))
                
                g1_mulAccC(_pVk, IC51x, IC51y, calldataload(add(pubSignals, 1600)))
                

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
            
            checkField(calldataload(add(_pubSignals, 1408)))
            
            checkField(calldataload(add(_pubSignals, 1440)))
            
            checkField(calldataload(add(_pubSignals, 1472)))
            
            checkField(calldataload(add(_pubSignals, 1504)))
            
            checkField(calldataload(add(_pubSignals, 1536)))
            
            checkField(calldataload(add(_pubSignals, 1568)))
            
            checkField(calldataload(add(_pubSignals, 1600)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
